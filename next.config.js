/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/images/placeholders/listing-placeholder.jpg',
        destination: '/images/listing-placeholder.jpg',
      },
    ];
  },
};
