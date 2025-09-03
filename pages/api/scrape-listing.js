// pages/api/scrape-listing.js
import * as cheerio from 'cheerio';

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: false,
  },
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function isSafePublicUrl(u) {
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return { ok: false, code: 'INVALID_URL' };
    const host = url.hostname.toLowerCase();
    const badHosts = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1']);
    if (badHosts.has(host) || host.endsWith('.local')) return { ok: false, code: 'BLOCKED_HOST' };
    return { ok: true, url };
  } catch {
    return { ok: false, code: 'INVALID_URL' };
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8',
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function readTextLimited(res, limitBytes = 2_000_000) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    let t = await res.text();
    return t.length > limitBytes ? t.slice(0, limitBytes) : t;
  }
  const decoder = new TextDecoder();
  let out = '';
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      out += decoder.decode(value, { stream: true });
      if (total >= limitBytes) break;
    }
  }
  out += decoder.decode();
  return out;
}

function absUrl(base, maybe) {
  if (!maybe) return null;
  try { return new URL(maybe, base).toString(); } catch { return null; }
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = (v ?? '').toString().trim();
    if (s) return s;
  }
  return '';
}

function extractFields(html, baseUrl) {
  const $ = cheerio.load(html);

  const title = firstNonEmpty(
    $('meta[property="og:title"]').attr('content'),
    $('meta[name="twitter:title"]').attr('content'),
    $('h1').first().text(),
    $('title').first().text(),
  );

  let description = firstNonEmpty(
    $('meta[name="description"]').attr('content'),
    $('meta[property="og:description"]').attr('content'),
    $('meta[name="twitter:description"]').attr('content'),
  );
  if (!description) {
    const paras = $('p').map((_, el) => $(el).text().trim()).get().filter((t) => t && t.length > 80);
    description = paras.slice(0, 4).join('\n\n');
  }

  const image = firstNonEmpty(
    absUrl(baseUrl, $('meta[property="og:image"]').attr('content')),
    absUrl(baseUrl, $('meta[name="twitter:image"]').attr('content')),
    absUrl(baseUrl, $('img[src]').first().attr('src')),
  );

  const metaPrice = firstNonEmpty(
    $('meta[property="product:price:amount"]').attr('content'),
    $('[itemprop="price"]').attr('content') || $('[itemprop="price"]').text(),
    $('[data-testid="price"]').text(),
    $('[class*=price]').first().text()
  );
  let price = metaPrice;
  if (!price) {
    const bodyText = $('body').text();
    const askingIdx = bodyText.search(/asking|list\s*price|price[\s:]/i);
    const dollarMatch = bodyText.match(/\$\s?[\d.,]+(?:\s?(?:million|m|k))?/i);
    if (askingIdx >= 0 && dollarMatch) price = dollarMatch[0];
  }

  const location = firstNonEmpty(
    $('[itemprop="addressLocality"]').text() &&
      `${$('[itemprop="addressLocality"]').text().trim()}${$('[itemprop="addressRegion"]').text() ? ', ' + $('[itemprop="addressRegion"]').text().trim() : ''}`,
    $('[data-testid*=location]').first().text(),
    $('[class*=location]').first().text()
  ) || (() => {
    const m = $('body').text().match(/\b([A-Za-z .'-]{2,}),\s*([A-Za-z]{2})\b/);
    return m ? `${m[1]}, ${m[2]}` : '';
  })();

  const industry = firstNonEmpty(
    $('[itemprop=industry]').text(),
    $('meta[name="category"]').attr('content'),
    $('meta[property="article:section"]').attr('content'),
    $('[class*=industry]').first().text()
  );

  const extracted = {
    title: title || '',
    price: price || '',
    description: description || '',
    location: location || '',
    industry: industry || '',
    image: image || '',
  };

  const hasAny =
    extracted.title || extracted.price || extracted.description || extracted.location || extracted.industry || extracted.image;

  return hasAny ? extracted : null;
}

async function tryFetchAndParse(target, refererOrigin) {
  // Direct fetch first
  let resp;
  try {
    resp = await fetchWithTimeout(
      target,
      { headers: { Referer: refererOrigin + '/' } },
      9000
    );
  } catch (e) {
    const msg = String(e?.message || '').toLowerCase();
    if (msg.includes('aborted') || msg.includes('timeout')) {
      return { ok: false, code: 'TIMEOUT', error: 'Timed out fetching URL.', via: 'direct' };
    }
    return { ok: false, code: 'FETCH_ERROR', error: `Network error${e?.code ? ' (' + e.code + ')' : ''}`, via: 'direct' };
  }

  if (!resp.ok) {
    return { ok: false, code: 'UPSTREAM', error: `HTTP ${resp.status}`, via: 'direct' };
  }

  const ct = resp.headers.get('content-type') || '';
  let html = await readTextLimited(resp, 2_000_000);

  const looksHtml =
    /<!doctype html/i.test(html.slice(0, 2000)) ||
    /<html[\s>]/i.test(html.slice(0, 2000));

  const isHtml =
    ct.includes('text/html') ||
    ct.includes('application/xhtml+xml') ||
    looksHtml;

  if (!isHtml) {
    return { ok: false, code: 'NON_HTML', error: `Unsupported content-type: ${ct}`, via: 'direct' };
  }

  try {
    const extracted = extractFields(html, target);
    if (!extracted) return { ok: false, code: 'EMPTY', error: 'Could not detect listing fields.', via: 'direct' };
    return { ok: true, extracted, via: 'direct' };
  } catch {
    return { ok: false, code: 'PARSE_ERROR', error: 'Failed to parse page HTML.', via: 'direct' };
  }
}

// Optional proxy fallback for blocked/slow sites.
// Enable via env:
//   ALLOW_PROXY_SCRAPE=1
//   SCRAPE_PROXY_URL=https://r.jina.ai/http/   (must include trailing slash)
async function tryProxyFallback(target) {
  if (!process.env.ALLOW_PROXY_SCRAPE || !process.env.SCRAPE_PROXY_URL) {
    // same shape as direct TIMEOUT so UI messaging stays consistent
    return { ok: false, code: 'TIMEOUT', error: 'Timed out fetching URL.', via: 'direct' };
  }

  // IMPORTANT: use the RAW URL after /http/ (NO encoding)
  const base = process.env.SCRAPE_PROXY_URL; // e.g. 'https://r.jina.ai/http/'
  const proxied = base + target;

  let resp;
  try {
    resp = await fetchWithTimeout(
      proxied,
      { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.8' } },
      12000
    );
  } catch {
    return { ok: false, code: 'TIMEOUT', error: 'Timed out (proxy).', via: 'proxy' };
  }

  if (!resp.ok) {
    return { ok: false, code: 'UPSTREAM', error: `Proxy HTTP ${resp.status}`, via: 'proxy' };
  }

  const ct = resp.headers.get('content-type') || '';
  let html = await readTextLimited(resp, 2_000_000);
  const looksHtml = /<html[\s>]/i.test(html.slice(0, 2000)) || /<!doctype html/i.test(html.slice(0, 2000));
  if (!(ct.includes('text/html') || looksHtml)) {
    // Some proxies return plain text/article text—still try to extract.
  }

  try {
    const extracted = extractFields(html, target);
    if (!extracted) return { ok: false, code: 'EMPTY', error: 'Proxy content had no listing fields.', via: 'proxy' };
    return { ok: true, extracted, via: 'proxy' };
  } catch {
    return { ok: false, code: 'PARSE_ERROR', error: 'Failed to parse proxy response.', via: 'proxy' };
  }
}

export default async function handler(req, res) {
  // CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: false, code: 'METHOD', error: 'Use POST {url}' });
  }

  try {
    const urlInput = (req.body?.url || '').toString().trim();
    if (!urlInput) {
      return res.status(200).json({ ok: false, code: 'MISSING_URL', error: 'No URL provided.' });
    }

    const safe = isSafePublicUrl(urlInput);
    if (!safe.ok) {
      const code = safe.code;
      return res.status(200).json({ ok: false, code, error: code === 'INVALID_URL' ? 'Invalid URL.' : 'That host is not allowed.' });
    }

    const target = safe.url.toString();

    // Try direct
    const direct = await tryFetchAndParse(target, safe.url.origin);
    if (direct.ok) return res.status(200).json(direct);

    // Only fallback to proxy for TIMEOUT/FETCH_ERROR (blocked/slow)
    if (direct.code === 'TIMEOUT' || direct.code === 'FETCH_ERROR') {
      const viaProxy = await tryProxyFallback(target);
      return res.status(200).json(viaProxy);
    }

    // For other errors (UPSTREAM/NON_HTML/EMPTY/PARSE_ERROR), return as-is
    return res.status(200).json(direct);
  } catch (err) {
    const message = err?.message || 'Unexpected server error.';
    return res.status(200).json({ ok: false, code: 'SERVER', error: message });
  }
}


