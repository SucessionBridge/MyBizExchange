// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { Toaster } from 'react-hot-toast';

import { Inter, Merriweather } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });

function AuthRedirector() {
  const session = useSession();
  const router = useRouter();
  const sb = useSupabaseClient();

  useEffect(() => {
    // ✅ Don't run redirect logic on the callback page
    if (router.pathname === '/auth/callback') return;

    if (!session?.user) return; // Wait for session to exist

    // ✅ Only redirect if on the homepage
    if (router.pathname === '/' && router.query.force !== 'true') {
      const checkBuyerProfile = async () => {
        const { data: profile } = await sb
          .from('buyers')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (profile) {
          router.replace('/buyer-dashboard');
        } else {
          router.replace('/buyer-onboarding');
        }
      };
      checkBuyerProfile();
    }
  }, [session, router, sb]);

  return null;
}

export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ✅ Wait until Supabase restores session before rendering anything
    const init = async () => {
      await supabase.auth.getSession();
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <AuthRedirector />
      <div className={`${inter.variable} ${merriweather.variable} font-sans min-h-screen bg-white text-gray-800`}>
        <Header />
        <main className="pt-20 px-4">
          <Component {...pageProps} />
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </SessionContextProvider>
  );
}
