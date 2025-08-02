// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('❌ Session error:', error.message);
        router.replace('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Logged in user:', user);

      if (user) {
        router.replace('/buyer-onboarding');
      } else {
        router.replace('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}

