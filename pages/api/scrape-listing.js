// pages/api/scrape-listing.js
import * as cheerio from "cheerio";

// Allow longer execution on Vercel (seconds)
export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
    externalResolver: true,
  },
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const isHttpUrl = (s) => {
  try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
};

const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
const absolutize = (src, base) => { try { return new URL(src, base).toString(); } catch { return null; } };

const pickTitle = ($) => {
  const m = $('meta[property="og:title"]').attr("content")
    || $('meta[name="twitter:title"]').attr("content");
  if (normalize(m)) return normalize(m);
  const t = $("title").text() || $("h1").first().text() || $("h2").first().text();
  return normalize(t);
};

const priceRe = /(?:USD|CAD|\$|£|€)\s?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?(?:\s?(?:K|k|M|m|million))?/;
const pickPrice = ($) => {
  const sels = ["[itemprop=price]", ".price", ".listing-price", ".price-value", ".amount", "[data-testid*=price]"];
  for (const s of sels) {
    const t = normalize($(s).first().text()) || $(s).attr("content");
    if (t && priceRe.test(t)) return t.match(priceRe)[0];
  }
  const body = normalize($("body").text());
  const m = body.match(priceRe);
  return m ? m[0] : "";
};

const pickDesc = ($) => {
  const metas = [
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
  ];
  for (const sel of metas) {
    const c = $(sel).attr("content");
    if (normalize(c)) return normalize(c).slice(0, 2000);
  }
  const paras = [];
  $("article p, .description p, #description p, p").each((_, el) => {
    const t = normalize($(el).text());
    if (t.length > 80) paras.push(t);
  });
  paras.sort((a, b) => b.length - a.length);
  return (paras[0] || "").slice(0, 2000);
};

const pickImage = ($, base) => {
  const meta = $('meta[property="og:image"]').attr("content")
          || $('meta[name="twitter:image"]').attr("content");
  const metaAbs = meta ? absolutize(meta, base) : null;
  if (metaAbs) return metaAbs;
  let best = null;
  $("img").each((_, el) => {
    if (best) return;
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src || src.startsWith("data:")) return;
    const abs = absolutize(src, base);
    if (abs && /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(abs)) best = abs;
  });
  return best || "";
};

const pickLocation = ($) => {
  const sels = [".location", ".listing-location", "[itemprop=address]", "address", ".address", "[data-testid*=location]"];
  for (const s of sels) {
    const t = normalize($(s).first().text());
    if (t && t.length >= 3) return t;
  }
  const m = ($("body").text() || "").match(/([A-Za-z .'\-]{2,}),\s*([A-Z]{2})(?![A-Za-z])/);
  return m ? normalize(m[0]) : "";
};

const pickIndustry = ($) => {
  const crumbs = [];
  $(".breadcrumb a, nav[aria-label=breadcrumb] a, .breadcrumbs a").each((_, el) => {
    const t = normalize($(el).text());
    if (t) crumbs.push(t);
  });
  if (crumbs.length) return crumbs[crumbs.length - 1];
  const cats = [
    "[itemprop=category]",
    ".category",
    "[data-testid*=category]",
    'meta[property="article:section"]',
  ];
  for (const s of cats) {
    if (s.startsWith("meta")) {
      const v = $(s).attr("content");
      if (normalize(v)) return normalize(v);
    } else {
      const t = normalize($(s).first().text());
      if (t) return t;
    }
  }
  return "";
};

export default async function handler(req, res) {
  // CORS + cache
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(200).json({ ok: false, error: "Use POST with JSON body: { url }" });
  }

  const url = normalize(req.body?.url);
  if (!isHttpUrl(url)) {
    return res.status(200).json({ ok: false, error: "Invalid or missing url." });
  }

  const controller = new AbortController();
  const timeoutMs = 30000; // 30s
  const to = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
      signal: controller.signal,
    }).catch((e) => { throw new Error(`Fetch failed: ${e.message}`); });

    clearTimeout(to);

    if (!r.ok) {
      return res.status(200).json({ ok: false, code: "UPSTREAM", error: `Upstream returned ${r.status}` });
    }

    const ctype = r.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(ctype)) {
      return res.status(200).json({ ok: false, code: "NON_HTML", error: `Unsupported content-type: ${ctype}` });
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    const extracted = {
      title: pickTitle($) || "",
      price: pickPrice($) || "",
      description: pickDesc($) || "",
      image: pickImage($, url) || "",
      location: pickLocation($) || "",
      industry: pickIndustry($) || "",
    };

    const hasAny = Object.values(extracted).some((v) => v && v.length);
    if (!hasAny) {
      return res.status(200).json({ ok: false, code: "EMPTY", error: "Parsed page but found no listing fields." });
    }

    return res.status(200).json({ ok: true, extracted });
  } catch (err) {
    clearTimeout(to);
    const msg = String(err?.message || "");
    const isAbort =
      err?.name === "AbortError" || /aborted|abortcontroller/i.test(msg);
    return res.status(200).json({
      ok: false,
      code: isAbort ? "TIMEOUT" : "SCRAPE_ERROR",
      error: isAbort ? `Timed out after ${timeoutMs}ms.` : "Fetch failed.",
    });
  } finally {
    clearTimeout(to);
  }
}


