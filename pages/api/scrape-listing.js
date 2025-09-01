// pages/api/scrape-listing.js
import * as cheerio from 'cheerio';

// Force Node runtime (cheerio won’t run on Edge)
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing or invalid "url".' });
    }

    let r;
    try {
      r = await fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
    } catch (netErr) {
      console.error('🌐 Network error while fetching:', netErr);
      return res.status(502).json({
        ok: false,
        error: `Network fetch failed: ${netErr?.message || 'unknown error'}`,
      });
    }

    if (!r.ok) {
      // Common: 403/404 from Cloudflare/WAF
      const txt = await r.text().catch(() => '');
      console.error(`🌐 Fetch not ok (${r.status})`, txt?.slice?.(0, 400));
      return res.status(400).json({
        ok: false,
        error: `Fetch failed (${r.status}). The site may block server requests. Try another URL or paste the text instead.`,
      });
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();

    // Title / name
    const businessName = text(
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      ''
    );

    // Description
    const description = text(
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
    );

    // Asking price (heuristic)
    const pageText = $('body').text();
    const priceMatch =
      pageText.match(/\$[\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i) ||
      pageText.match(/asking\s*price[:\s]*\$?([0-9,\.]+)/i);
    const askingPriceRaw = priceMatch ? priceMatch[0] : '';
    const askingPriceNum = Number((askingPriceRaw || '').replace(/[^0-9.]/g, ''));
    const askingPrice = Number.isFinite(askingPriceNum) ? askingPriceNum : null;

    // Location (simple US City, ST guess)
    const locMatch =
      pageText.match(/\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*),?\s([A-Z]{2})\b/);
    const city = locMatch ? locMatch[1] : '';
    const state = locMatch ? locMatch[2] : '';

    // Images
    const ogImages = $('meta[property="og:image"]')
      .map((_, el) => $(el).attr('content'))
      .get()
      .filter(Boolean);

    const imgTags = $('img')
      .map((_, el) => $(el).attr('src'))
      .get()
      .filter(Boolean);

    const toAbs = (src) => {
      try { return new URL(src, url).href; } catch { return null; }
    };

    const images = [...ogImages, ...imgTags]
      .map(toAbs)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 8);

    const prefill = {
      businessName,
      industry: '',
      city,
      state,
      askingPrice,
      annualRevenue: '',
      sde: '',
      description:
        description ||
        `Imported from ${url}. Review and expand details before publishing.`,
      images,
      reasons: [
        'We import your public listing to save time and reduce copy/paste.',
        'We only prefill obvious fields; you keep complete control.',
        'You can edit everything before creating the listing.',
      ],
      tips: [
        'Double-check asking price & location format.',
        'Add revenue/SDE for stronger buyer matches.',
        'Replace imported photos with originals as needed.',
      ],
    };

    return res.status(200).json({ ok: true, prefill });
  } catch (err) {
    console.error('❌ Scrape route error:', err);
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Server error during scrape',
    });
  }
}
