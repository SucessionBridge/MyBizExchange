// pages/api/import-listing.js
import cheerio from 'cheerio';

// --- tiny helpers ---
const BAD_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
function isPrivateHost(hostname) {
  if (BAD_HOSTS.has(hostname)) return true;
  if (/^(10|127)\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  const m = hostname.match(/^172\.(\d+)\./); // 172.16.0.0 – 172.31.255.255
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

function toAbs(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function parseMoney(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/[, ]/g, '').toLowerCase();
  // $1.2m, 1.2m, $450k, 450k, $1200000
  const m1 = s.match(/\$?\s*([\d.]+)\s*([mk])/i);
  if (m1) {
    const num = parseFloat(m1[1]);
    if (Number.isNaN(num)) return null;
    const mult = m1[2].toLowerCase() === 'm' ? 1_000_000 : 1_000;
    return Math.round(num * mult);
  }
  const m2 = s.match(/\$?\s*([\d.]+)/);
  if (m2) {
    const num = parseFloat(m2[1]);
    if (Number.isNaN(num)) return null;
    return Math.round(num);
  }
  return null;
}

function pickLongest(...vals) {
  const arr = vals.filter(Boolean).map(v => String(v).trim());
  return arr.sort((a,b) => b.length - a.length)[0] || '';
}

// Extract info from HTML with gentle heuristics
function extractFields(html, baseUrl) {
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content');
  const ogDesc  = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || $('meta[name="twitter:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

  // Structured data
  let ld = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const txt = $(el).contents().text();
      if (!txt) return;
      const parsed = JSON.parse(txt);
      ld.push(parsed);
    } catch {}
  });
  // Flatten @graph
  ld = ld.flatMap(x => Array.isArray(x?.['@graph']) ? x['@graph'] : [x]);

  // candidates
  let name = ogTitle;
  let desc = ogDesc;

  // price from LD
  let ldPrice = null;
  ld.forEach(obj => {
    try {
      if (!obj || typeof obj !== 'object') return;
      if (obj.offers?.price) ldPrice = ldPrice ?? obj.offers.price;
      if (obj.price) ldPrice = ldPrice ?? obj.price;
      if (obj.offers?.priceCurrency) {/* keep currency if you want later */}
      if (!name && obj.name) name = obj.name;
      if (!desc && obj.description) desc = obj.description;
    } catch {}
  });

  // fallback: main text
  const mainText = pickLongest(
    $('main').text(),
    $('article').text(),
    $('#content').text(),
    $('body').text()
  ).replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (!desc && mainText) {
    // take first ~800 chars of continuous text
    desc = mainText.split('\n').filter(p => p.trim().length > 60).slice(0, 6).join('\n\n').slice(0, 800);
  }

  // Simple label-based scrapes from visible text
  const textForScan = $('body').text().replace(/\s+/g, ' ').toLowerCase();

  // Price
  let askingPrice = parseMoney(ldPrice);
  if (!askingPrice) {
    const m = textForScan.match(/(asking price|list price|price)\s*[:\-]?\s*\$?\s*([\d.,]+(?:\s*[mk])?)/i);
    if (m) askingPrice = parseMoney(m[2]);
  }

  // Revenue
  let annualRevenue = null;
  {
    const m = textForScan.match(/(annual (revenue|sales|turnover)|revenue)\s*[:\-]?\s*\$?\s*([\d.,]+(?:\s*[mk])?)/i);
    if (m) annualRevenue = parseMoney(m[3]);
  }

  // SDE (Cash Flow)
  let sde = null;
  {
    const m = textForScan.match(/(sde|cash ?flow)\s*[:\-]?\s*\$?\s*([\d.,]+(?:\s*[mk])?)/i);
    if (m) sde = parseMoney(m[2]);
  }

  // Location (very light)
  let city = '', state = '';
  // Look for patterns like "City, ST"
  const locm = $('body').text().match(/\b([A-Za-z .'-]{3,}),\s*([A-Za-z]{2})\b/);
  if (locm) { city = locm[1].trim(); state = locm[2].trim(); }

  // Try LD address
  for (const obj of ld) {
    try {
      const addr = obj.address || obj.location?.address;
      if (addr) {
        if (!city && addr.addressLocality) city = addr.addressLocality;
        if (!state && (addr.addressRegion || addr.addressState)) state = addr.addressRegion || addr.addressState;
      }
    } catch {}
  }

  // Industry guess (breadcrumb/category)
  let industry = '';
  const bc = $('nav.breadcrumb, .breadcrumb, .breadcrumbs').text();
  if (bc) {
    const parts = bc.split(/›|\/|>/).map(s => s.trim()).filter(Boolean);
    industry = parts.pop() || '';
  }
  if (!industry && name) {
    const kw = name.toLowerCase();
    if (kw.includes('hvac')) industry = 'HVAC';
    else if (kw.includes('ecommerce')) industry = 'eCommerce';
    else if (kw.includes('restaurant')) industry = 'Restaurant';
  }

  // Images (og + big imgs)
  const imgSet = new Set();
  if (ogImage) {
    const u = toAbs(ogImage, baseUrl);
    if (u) imgSet.add(u);
  }
  $('img[src]').each((_, el) => {
    const u = toAbs($(el).attr('src'), baseUrl);
    if (!u) return;
    // prefer non-icon images
    const w = Number($(el).attr('width') || 0);
    const h = Number($(el).attr('height') || 0);
    if (u.match(/\.(svg|ico)$/i)) return;
    if (Math.max(w, h) >= 200 || (!w && !h)) imgSet.add(u);
  });
  const imageUrls = Array.from(imgSet).slice(0, 8);

  return {
    businessName: name || '',
    industry,
    city,
    state,
    askingPrice,
    annualRevenue,
    sde,
    description: desc || '',
    imageUrls
  };
}

// --- API handler ---
export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing ?url=' });
    }

    let u;
    try {
      u = new URL(url);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid URL' });
    }
    if (!/^https?:$/.test(u.protocol)) {
      return res.status(400).json({ ok: false, error: 'Only http/https allowed' });
    }
    if (isPrivateHost(u.hostname)) {
      return res.status(400).json({ ok: false, error: 'Private/localhost URLs are blocked' });
    }

    // Fetch with a short timeout
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(u.toString(), {
      headers: { 'user-agent': 'SuccessionBridgeBot/1.0 (+fetching for broker import)' },
      signal: controller.signal
    }).catch(e => ({ ok: false, status: 599, text: async () => e.message || 'Fetch error' }));
    clearTimeout(t);

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      return res.status(400).json({ ok: false, error: `Could not fetch (${resp.status})`, detail: body.slice(0, 300) });
    }

    const html = await resp.text();
    const fields = extractFields(html, u.toString());
    return res.status(200).json({ ok: true, fields });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Server error', detail: e.message });
  }
}
