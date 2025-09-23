// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import supabase from '../lib/supabaseClient';
import { Toaster } from 'react-hot-toast';

import { Inter, Merriweather } from 'next/font/google';
import ErrorBoundary from '../components/ErrorBoundary';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Universal magic-link hash catcher:
  // If any page loads with a Supabase magic-link hash (#access_token=...),
  // forward to /auth/callback with the same hash, preserving ?next if present
  // (or from localStorage 'pendingNext').
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawHash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    if (!rawHash) return;

    const params = new URLSearchParams(rawHash);
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    const type = params.get('type'); // e.g., "magiclink"

    // Only act when it actually looks like a Supabase magic link
    if (!(access && refresh) && type !== 'magiclink') return;

    const search = new URLSearchParams(window.location.search);
    const next = search.get('next') || localStorage.getItem('pendingNext') || '/';
    const nextParam = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';

    // Hand off to our callback route to set the session + redirect
    window.location.replace(`/auth/callback${nextParam}#${rawHash}`);
  }, []); // run once on mount

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <ErrorBoundary>
        <div className={`${inter.variable} ${merriweather.variable} font-sans bg-white text-gray-800 min-h-screen flex flex-col`}>
          {/* Default SEO / branding for MyBizExchange */}
          <Head>
            <title>MyBizExchange</title>
            <meta name="description" content="MyBizExchange — a modern marketplace for buying and selling small businesses, with a focus on seller-financed deals." />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#1E3A8A" />
            <meta property="og:site_name" content="MyBizExchange" />
            <meta property="og:title" content="MyBizExchange" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://mybizexchange.com" />
            {/* Update this image in /public if you have a branded OG image */}
            <meta property="og:image" content="/og-default.png" />
            <link rel="icon" href="/favicon.ico" />
            <link rel="canonical" href="https://mybizexchange.com" />
          </Head>

          <Header />

          <main className="flex-1 pt-20 px-4">
            <Component {...pageProps} />
          </main>

          {/* You can pass brand props if your Footer supports them; harmless if ignored */}
          <Footer brandName="MyBizExchange" domain="mybizexchange.com" />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#333', color: '#fff' },
            }}
          />
        </div>
      </ErrorBoundary>
    </SessionContextProvider>
  );
}

