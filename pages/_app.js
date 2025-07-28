// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';

function AuthRedirector() {
  const session = useSession();
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    console.log('🔍 AuthRedirector Path:', router.pathname, 'Force:', router.query.force, 'User:', session?.user?.id);

    // ✅ Only run redirect on homepage `/` (not on dashboard or other routes)
    if (!session?.user || router.pathname !== '/' || router.query.force === 'true') {
      if (router.query.force === 'true') console.log('✅ Force=true detected. Skipping redirect.');
      return;
    }

    const checkBuyerProfile = async () => {
      console.log('📡 Checking buyer profile for user:', session.user.id);
      const { data: profile } = await supabase
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
    };

    checkBuyerProfile();
  }, [session, router, supabase]);

  return null;
}

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient()); // ✅ Single instance

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
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
            style: { background: '#333', color: '#fff' },
          }}
        />
      </div>
    </SessionContextProvider>
  );
}


