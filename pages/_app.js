// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  // 🛠 Force refresh session on magic link redirect
  useEffect(() => {
    const refreshSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.warn('Session error:', error.message);
      } else {
        // Optional: confirm session is valid
        console.log('🔐 Session restored:', data.session?.user?.email);
      }
    };
    refreshSession();
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


