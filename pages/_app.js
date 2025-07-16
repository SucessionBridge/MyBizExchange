// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

function AuthRedirector() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user || router.pathname !== '/') return;

    const checkBuyerProfile = async () => {
      const userId = session.user.id;

      const { data: profile, error } = await supabase
        .from('buyers')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (profile) {
        console.log('✅ Buyer found — redirecting to dashboard');
        router.replace('/buyer/dashboard');
      } else {
        console.log('🆕 No profile — redirecting to onboarding');
        router.replace('/buyers');
      }
    };

    checkBuyerProfile();
  }, [session, router]);

  return null;
}

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <AuthRedirector />
      <div className="min-h-screen bg-white text-gray-800">
        <Header />
        <main className="pt-20 px-4">
          <Component {...pageProps} />
        </main>
      </div>
    </SessionContextProvider>
  );
}
