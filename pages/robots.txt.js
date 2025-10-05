// pages/robots.txt.js
export async function getServerSideProps({ req, res }) {
  const host = req.headers['host'];
  // Always prefer https for production; fallback for local
  const proto = host.includes('localhost') ? 'http' : 'https';
  const siteUrl = `${proto}://${host}`;

  const text = [
    'User-agent: *',
    'Allow: /',
    'Crawl-delay: 10',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  res.write(text);
  res.end();

  return { props: {} };
}

export default function RobotsTxt() {
  return null;
}
