// pages/robots.txt.js
export async function getServerSideProps({ req, res }) {
  const host = req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const siteUrl = `${proto}://${host}`;

  const text = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  res.write(text);
  res.end();

  return { props: {} };
}

export default function RobotsTxt() {
  return null;
}
