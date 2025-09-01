// pages/api/scrape-listing.js
import * as cheerio from 'cheerio';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function clean(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchHtml(url) {
  // Add UA and a timeout so some sites don't block us
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000); // 12s
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, error: 'Method Not Allowed. Use POST { url }' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing "url" string.' });
    }

    const { ok, status, html } = await fetchHtml(url);
    if (!ok) {
      // Site returned 4xx/5xx — still return JSON so the client can show a friendly error
      return res
        .status(200)
        .json({ ok: false, error: `Upstream responded ${status}`, status });
    }

    const $ = cheerio.load(html);

    // Heuristics: try common places for the bits we want
    const title =
      clean($('meta[property="og:title"]').attr('content')) ||
      clean($('h1').first().text()) ||
      clean($('title').text());

    const price =
      clean($('[itemprop="price"], .price, .asking-price').first().text()) ||
      clean($('body').text().match(/\$[\d,]+(?:\.\d{2})?/)?.[0] || '');

    // Description: prefer og:description, then a long paragraph block
    let description =
      clean($('meta[property="og:description"]').attr('content')) || '';

    if (!description) {
      // Pick the longest paragraph-ish block as a fallback
      let best = '';
      $('p, .description, [itemprop="description"]').each((_, el) => {
        const txt = clean($(el).text());
        if (txt.length > best.length) best = txt;
      });
      description = best;
    }

    // Location: try some common selectors/phrases
    const location =
      clean($('[itemprop="addressLocality"]').first().text()) ||
      clean($('.location, .listing-location, [data-location]').first().text()) ||
      clean((description.match(/\b([A-Z][a-z]+,\s*[A-Z]{2})\b/) || [])[0] || '');

    // Industry: usually appears in badges or sections; heuristic only
    const industry =
      clean($('.industry, .category, [data-category]').first().text()) ||
      '';

    // First image
    const image =
      clean($('meta[property="og:image"]').attr('content')) ||
      clean($('img').first().attr('src') || '');

    return res.status(200).json({
      ok: true,
      extracted: {
        title,
        price,
        description,
        location,
        industry,
        image,
      },
    });
  } catch (err) {
    // Never return HTML; keep it JSON so the client never explodes on .json()
    return res.status(200).json({
      ok: false,
      error: err?.name === 'AbortError' ? 'Timed out fetching URL' : (err?.message || 'Scrape failed'),
    });
  }
}

