// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" dir="ltr">
        <Head>
          {/* Keep _document Head minimal. Page-level <Head> should set title, description, OG, canonical, etc. */}

          {/* Performance: preconnect to Supabase for faster image and data loading */}
          <link
            rel="preconnect"
            href="https://yqccgmgycvaahjwbnhze.supabase.co"
            crossOrigin=""
          />

          {/* Helpful defaults */}
          <meta name="format-detection" content="telephone=no" />
          <meta name="color-scheme" content="light" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
