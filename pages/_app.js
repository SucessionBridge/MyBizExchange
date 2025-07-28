// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useEffect } from 'react';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient'; // ✅ Use the single shared instance
import { Toaster } from 'react-hot-toast';

function AuthRedirector() {
  const session = useSession();
  const router = useRouter();
  const sb = useSupabaseClient();

  useEffect(() => {
    console.log('🔍 AuthRedirector Path:', router.pathname, 'Force:', router.query.force, 'User:', session?.user?.id);

    // ✅ Skip redirect if user clicked home with ?force=true
    if (!session?.user || router.pathname !== '/' || router.query.force === 'true') {
      if (router.query.force === 'true') {
        console.log('✅ Force=true detected. Skipping redirect to allow homepage view.');
      }
      return;
    }

    const checkBuyerProfile = async () => {
      console.log('📡 Checking buyer profile for user:', session.user.id);

      const { data: profile, error } = await sb
        .from('buyers')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (error) console.error('❌ Error fetching buyer profile:', error.message);

      if (profile) {
        console.log('✅ Buyer found — redirecting to dashboard');
        router.replace('/buyer-dashboard');
      } else {
        console.log('🆕 No profile — redirecting to onboarding');
        router.replace('/buyer-onboarding');
      }
    };

    checkBuyerProfile();
  }, [session, router, sb]);

  useEffect(() => {
    const { data: authListener } = sb.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event detected:', event, 'Path:', router.pathname, 'Force:', router.query.force);

      if (
        event === 'SIGNED_IN' &&
        session?.user &&
        router.pathname === '/' &&
        router.query.force !== 'true'
      ) {
        console.log('🔁 Auth SIGNED_IN event triggered for user:', session.user.id);

        const { data: profile } = await sb
          .from('buyers')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (profile) {
          console.log('✅ Buyer found after SIGNED_IN — redirecting to dashboard');
          router.replace('/buyer-dashboard');
        } else {
          console.log('🆕 No profile after SIGNED_IN — redirecting to onboarding');
          router.replace('/buyer-onboarding');
        }
      } else if (router.query.force === 'true') {
        console.log('✅ Auth event fired but Force=true active. No redirect.');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router, sb]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <AuthRedirector />
      <div className="min-h-screen bg-white text-gray-800">
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



