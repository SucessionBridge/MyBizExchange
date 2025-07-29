// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useEffect } from 'react';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { Toaster } from 'react-hot-toast';

// ✅ Import Google Fonts using next/font
import { Inter, Merriweather } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });

function AuthRedirector() {
  const session = useSession();
  const router = useRouter();
  const sb = useSupabaseClient();

  useEffect(() => {
    console.log('🔍 AuthRedirector Path:', router.pathname, 'Force:', router.query.force, 'User:', session?.user?.id);

    if (!session?.user || router.pathname !== '/' || router.query.force === 'true') {
      if (router.query.force === 'true') {
        console.log('✅ Force=true detected. Skipping redirect to allow homepage view.');
      }
      return;
    }

    const checkBuyerProfile = async () => {
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
    };

    checkBuyerProfile();
  }, [session, router, sb]);

  useEffect(() => {
    const { data: authListener } = sb.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, 'Path:', router.pathname);

      if (
        event === 'SIGNED_IN' &&
        session?.user &&
        router.pathname === '/' &&
        router.query.force !== 'true'
      ) {
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
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, [router, sb]);

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
