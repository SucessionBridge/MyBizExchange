// pages/sitemap.xml.js
import { createClient } from '@supabase/supabase-js';

function buildUrlTag(loc, lastmod, changefreq = 'weekly', priority = '0.7') {
  return `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function getServerSideProps({ req, res }) {
  const host = req.headers['host'] || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
  // Prefer env when set; else infer from request. Use https in prod.
  const baseFromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl = baseFromEnv || `${isLocal ? 'http' : 'https'}://${host}`;

  // Fetch active listings for dynamic entries
  let listings = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase
      .from('sellers')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000); // adjust if you expect more
    if (!error && data) listings = data;
  } catch (e) {
    // Swallow errors; still return a valid sitemap for static pages
    listings = [];
  }

  // Core static routes you want indexed
  const staticRoutes = [
    '/', '/listings', '/sellers', '/business-valuation', '/scorecard',
    '/pricing', '/about', '/contact', '/terms', '/privacy',
    // Include your guides & blog root if they exist:
    '/guides/how-buyers-value',
    '/guides/financing-options',
    '/guides/how-to-sell',
    '/guides/prep-to-sell',
    '/blog',
    // Keep your HTML sitemap too (not required, but fine to expose):
    '/sitemap'
  ];

  const nowISO = new Date().toISOString();

  const staticXml = staticRoutes.map((path) =>
    buildUrlTag(`${siteUrl}${path}`, nowISO, 'weekly', '0.6')
  );

  const listingXml = listings.map((l) => {
    const lastmod = (l.updated_at || l.created_at) ? new Date(l.updated_at || l.created_at).toISOString() : nowISO;
    return buildUrlTag(`${siteUrl}/listings/${l.id}`, lastmod, 'daily', '0.8');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${[...staticXml, ...listingXml].join('\n')}
</urlset>`.trim();

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache for 1h on the edge; serve stale for a day while revalidating
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapXML() {
  return null;
}

