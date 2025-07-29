// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      console.log('📍 Entered /auth/callback');

      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('❌ Auth error:', error);
        router.replace('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Logged in user:', user?.email);

      // 🔥 TEMP: Just send to dashboard to verify login works
      router.replace('/buyer-dashboard');
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}
