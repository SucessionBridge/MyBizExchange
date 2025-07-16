// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  // 🛠 Force refresh session on magic link redirect
  useEffect(() => {
    const handleRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && router.pathname === '/') {
        console.log('🔐 Logged in as:', user.email);

        const { data: profile, error } = await supabase
          .from('buyers')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching buyer profile:', error.message);
        }

        if (profile) {
          console.log('✅ Buyer profile found. Redirecting to dashboard...');
          router.push('/buyer/dashboard');
        } else {
          console.log('👤 No profile found. Redirecting to buyer onboarding...');
          router.push('/buyers');
        }
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <div className="min-h-screen bg-white text-gray-800">
        <Header />
        <main className="pt-20 px-4">
          <Component {...pageProps} />
        </main>
      </div>
    </SessionContextProvider>
  );
}


