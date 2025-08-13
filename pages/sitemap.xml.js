// pages/sitemap.xml.js
import { createClient } from '@supabase/supabase-js';

function xmlEscape(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function getServerSideProps({ req, res }) {
  const host = req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const siteUrl = `${proto}://${host}`;
  const now = new Date().toISOString().split('T')[0];

  // ----- Static routes you already have -----
  const staticRoutes = [
    '/', '/listings', '/sellers', '/business-valuation', '/scorecard', '/pricing',
    '/guides/how-buyers-value', '/guides/financing-options',
    '/guides/how-to-sell', '/guides/prep-to-sell',
    '/blog', '/about', '/contact', '/terms', '/privacy', '/sitemap'
  ];

  // ----- Try to include active listing detail pages (/listings/[id]) -----
  let listingUrls = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Adjust table/filters if your schema differs
    const { data, error } = await supabase
      .from('sellers')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (!error && Array.isArray(data)) {
      listingUrls = data.map((row) => ({
        loc: `${siteUrl}/listings/${row.id}`,
        lastmod: (row.updated_at ? new Date(row.updated_at) : new Date()).toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.8',
      }));
    }
  } catch {
    // Fail silently – we’ll still emit a valid sitemap with static routes
  }

  const urls = [
    // homepage with higher priority
    { loc: `${siteUrl}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    // other static pages
    ...staticRoutes
      .filter((p) => p !== '/') // already included
      .map((p) => ({
        loc: `${siteUrl}${p}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.6',
      })),
    // dynamic listings
    ...listingUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SiteMapXML() {
  return null;
}
