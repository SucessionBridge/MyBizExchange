// pages/api/scrape-listing.js
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing "url".' });
    }

    // Fetch the HTML
    const r = await fetch(url, {
      headers: {
        // Some brokers block non-browser UAs; this helps.
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!r.ok) {
      return res
        .status(400)
        .json({ ok: false, error: `Fetch failed (${r.status})` });
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    // ---- helpers ----
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const first = (arr) => (arr && arr.length ? arr[0] : null);

    // Title / name
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const metaTitle = $('title').text();
    const h1 = $('h1').first().text();
    const businessName = text(ogTitle || h1 || metaTitle || '');

    // Description
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const metaDesc = $('meta[name="description"]').attr('content');
    const description = text(ogDesc || metaDesc || '');

    // Price (simple heuristics)
    const pageText = $('body').text();
    const priceMatch =
      pageText.match(/\$[\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i) ||
      pageText.match(/asking\s*price[:\s]*\$?([0-9,\.]+)/i);
    const askingPriceRaw = priceMatch ? priceMatch[0] : '';
    const askingPrice = Number(
      (askingPriceRaw || '').replace(/[^0-9.]/g, '')
    );
    const askingPriceOrNull = Number.isFinite(askingPrice) ? askingPrice : null;

    // Location (very heuristic)
    const locMatch =
      pageText.match(
        /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*),?\s([A-Z]{2})\b/
      ) || null;
    const city = locMatch ? locMatch[1] : '';
    const state = locMatch ? locMatch[2] : '';

    // Images (prefer OpenGraph; fall back to <img>)
    const ogImages = $('meta[property="og:image"]')
      .map((_, el) => $(el).attr('content'))
      .get()
      .filter(Boolean);

    const imgTags = $('img')
      .map((_, el) => $(el).attr('src'))
      .get()
      .filter(Boolean);

    // Resolve relative URLs if needed
    const toAbs = (src) => {
      try {
        return new URL(src, url).href;
      } catch {
        return null;
      }
    };

    const images = [...ogImages, ...imgTags]
      .map(toAbs)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 8);

    // Build prefill object for your form
    const prefill = {
      businessName,
      industry: '', // brokers’ pages vary; you can fill this later
      city,
      state,
      askingPrice: askingPriceOrNull,
      annualRevenue: '',
      sde: '',
      description:
        description ||
        `Imported from ${url}. Review and expand details before publishing.`,
      images,
      reasons: [
        'We import the broker’s page to save you time.',
        'We only prefill obvious fields; you stay in control.',
        'You can edit anything before creating the listing.',
      ],
      tips: [
        'Double-check the asking price and location formatting.',
        'Add or remove photos as needed.',
        'Include revenue/SDE if you want to appear in more buyer filters.',
      ],
    };

    return res.status(200).json({ ok: true, prefill });
  } catch (err) {
    // IMPORTANT: always return JSON so the client never tries to parse HTML
    return res
      .status(500)
      .json({ ok: false, error: err?.message || 'Server error' });
  }
}
