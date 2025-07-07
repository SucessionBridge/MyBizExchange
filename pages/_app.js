// pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Supabase auth event:', event);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <main className="pt-20 px-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}



