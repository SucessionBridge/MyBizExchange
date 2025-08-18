// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const go = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) return router.replace('/login');

      const url = new URL(window.location.href);
      const next = url.searchParams.get('next') || '/seller'; // default to seller onboarding
      router.replace(next);
    };
    go();
  }, [router]);

  return <div className="min-h-screen flex items-center justify-center">Logging you in...</div>;
}



