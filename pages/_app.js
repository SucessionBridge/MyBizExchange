// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import supabase from '../lib/supabaseClient';
import { Toaster } from 'react-hot-toast';

import { Inter, Merriweather } from 'next/font/google';
import ErrorBoundary from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });

export default function App({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <ErrorBoundary>
        {/* Flex column so footer anchors to bottom */}
        <div className={`${inter.variable} ${merriweather.variable} font-sans bg-white text-gray-800 min-h-screen flex flex-col`}>
          <Header />
          {/* flex-1 lets the main content grow and push footer down */}
          <main className="flex-1 pt-20 px-4">
            <Component {...pageProps} />
          </main>
          <Footer />
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
