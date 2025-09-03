// pages/api/scrape-listing.js
import * as cheerio from 'cheerio';

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' }, // requests are tiny
    responseLimit: false,             // don’t truncate large HTML responses
  },
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Basic SSRF guard: allow only http/https and block local hosts.
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
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

function absUrl(base, maybe) {
  if (!maybe) return null;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return null;
  }
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = (v ?? '').toString().trim();
    if (s) return s;
  }
  return '';
}

// Heuristics to pull listing-ish fields
function extractFields(html, baseUrl) {
  const $ = cheerio.load(html);

  // Title
  const title = firstNonEmpty(
    $('meta[property="og:title"]').attr('content'),
    $('meta[name="twitter:title"]').attr('content'),
    $('h1').first().text(),
    $('title').first().text(),
  );

  // Description (prefer metas; fallback to first long-ish paragraph)
  let description = firstNonEmpty(
    $('meta[name="description"]').attr('content'),
    $('meta[property="og:description"]').attr('content'),
    $('meta[name="twitter:description"]').attr('content'),
  );
  if (!description) {
    const paras = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t && t.length > 80);
    description = paras.slice(0, 4).join('\n\n');
  }

  // Image
  const image = firstNonEmpty(
    absUrl(baseUrl, $('meta[property="og:image"]').attr('content')),
    absUrl(baseUrl, $('meta[name="twitter:image"]').attr('content')),
    absUrl(baseUrl, $('img[src]').first().attr('src')),
  );

  // Price (text-y; we don’t hard-parse here—client already parses money)
  const metaPrice = firstNonEmpty(
    $('meta[property="product:price:amount"]').attr('content'),
    $('[itemprop="price"]').attr('content') || $('[itemprop="price"]').text(),
    $('[data-testid="price"]').text(),
    $('[class*=price]').first().text()
  );
  let price = metaPrice;
  if (!price) {
    // fallback: search for a $… pattern near "Asking" / "Price"
    const bodyText = $('body').text();
    const askingIdx = bodyText.search(/asking|list\s*price|price[\s:]/i);
    const dollarMatch = bodyText.match(/\$\s?[\d.,]+(?:\s?(?:million|m|k))?/i);
    if (askingIdx >= 0 && dollarMatch) price = dollarMatch[0];
  }

  // Location
  const location = firstNonEmpty(
    $('[itemprop="addressLocality"]').text() &&
      `${$('[itemprop="addressLocality"]').text().trim()}${$('[itemprop="addressRegion"]').text() ? ', ' + $('[itemprop="addressRegion"]').text().trim() : ''}`,
    $('[data-testid*=location]').first().text(),
    $('[class*=location]').first().text()
  ) || (() => {
    // Fallback: find a "City, ST" pattern in visible text
    const m = $('body').text().match(/\b([A-Za-z .'-]{2,}),\s*([A-Za-z]{2})\b/);
    return m ? `${m[1]}, ${m[2]}` : '';
  })();

  // Industry (very best-effort)
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

export default async function handler(req, res) {
  // CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

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
      const message =
        code === 'INVALID_URL'
          ? 'Invalid URL.'
          : 'That host is not allowed.';
      return res.status(200).json({ ok: false, code, error: message });
    }

    const target = safe.url.toString();

    // Fetch with timeout; many sites block HEAD so we do GET once.
    let resp;
    try {
      // CHANGED: add Referer header and slightly shorter timeout (9s)
      resp = await fetchWithTimeout(
        target,
        { headers: { Referer: safe.url.origin + '/' } },
        9000
      );
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('aborted') || msg.includes('timeout')) {
        return res.status(200).json({ ok: false, code: 'TIMEOUT', error: 'Timed out fetching URL.' });
      }
      return res.status(200).json({ ok: false, code: 'FETCH_ERROR', error: 'Network error fetching URL.' });
    }

    if (!resp.ok) {
      return res
        .status(200)
        .json({ ok: false, code: 'UPSTREAM', error: `HTTP ${resp.status}` });
    }

    // CHANGED: read body first, sniff for HTML even if content-type is wrong
    const ct = resp.headers.get('content-type') || '';
    let html = await resp.text();
    if (html.length > 2_000_000) html = html.slice(0, 2_000_000);

    const looksHtml =
      /<!doctype html/i.test(html.slice(0, 2000)) ||
      /<html[\s>]/i.test(html.slice(0, 2000));

    const isHtml =
      ct.includes('text/html') ||
      ct.includes('application/xhtml+xml') ||
      looksHtml;

    if (!isHtml) {
      return res
        .status(200)
        .json({ ok: false, code: 'NON_HTML', error: `Unsupported content-type: ${ct}` });
    }

    // Extract
    let extracted = null;
    try {
      extracted = extractFields(html, target);
    } catch {
      return res
        .status(200)
        .json({ ok: false, code: 'PARSE_ERROR', error: 'Failed to parse page HTML.' });
    }

    if (!extracted) {
      return res
        .status(200)
        .json({ ok: false, code: 'EMPTY', error: 'Could not detect listing fields.' });
    }

    return res.status(200).json({ ok: true, extracted });
  } catch (err) {
    // Last-resort safety
    const message = err?.message || 'Unexpected server error.';
    return res.status(200).json({ ok: false, code: 'SERVER', error: message });
  }
}
