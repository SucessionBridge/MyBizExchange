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
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      console.log('⏸️ No session yet, waiting...');
      return; // Don't redirect until we know
    }

    if (router.pathname !== '/' || router.query.force === 'true') {
      return;
    }

    const checkBuyerProfile = async () => {
      setChecking(true);
      console.log('📡 Checking buyer profile for user:', session.user.id);

      const { data: profile } = await sb
        .from('buyers')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (profile) {
        console.log('✅ Buyer found — redirecting to dashboard');
        router.replace('/buyer-dashboard');
      } else {
        console.log('🆕 No profile — redirecting to onboarding');
        router.replace('/buyer-onboarding');
      }
      setChecking(false);
    };

    checkBuyerProfile();
  }, [session, router, sb]);

  return null;
}

export default function App({ Component, pageProps }) {
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
