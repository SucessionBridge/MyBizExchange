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

  // 1. Handle existing session (e.g., page reload)
  useEffect(() => {
    if (!session?.user || router.pathname !== '/') return;

    const checkBuyerProfile = async () => {
      const { data: profile } = await supabase
        .from('buyers')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (profile) {
        console.log('✅ Buyer found — redirecting to dashboard');
        router.replace('/buyer/dashboard');
      } else {
        console.log('🆕 No profile — redirecting to onboarding');
        router.replace('/buyer-onboarding'); // ✅ FIXED
      }
    };

    checkBuyerProfile();
  }, [session, router]);

  // 2. Also listen for SIGNED_IN event (magic link trigger)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && router.pathname === '/') {
          console.log('🔁 Auth SIGNED_IN event detected');
          const { data: profile } = await supabase
            .from('buyers')
            .select('id')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          if (profile) {
            router.replace('/buyer/dashboard');
          } else {
            router.replace('/buyer-onboarding'); // ✅ FIXED
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

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
