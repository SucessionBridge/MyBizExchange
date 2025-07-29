// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const completeLogin = async () => {
      console.log("📍 Entered /auth/callback");

      // ✅ Finish magic link/OAuth login
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession();
      if (exchangeError) {
        console.error("❌ Session exchange failed:", exchangeError);
        router.replace('/login');
        return;
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ No user found:", userError);
        router.replace('/login');
        return;
      }

      console.log("✅ Logged in as:", user.email);

      // ✅ Check if this user has a buyer profile
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (buyer) {
        router.replace('/buyer-dashboard');
        return;
      }

      // ✅ Otherwise send to onboarding
      router.replace('/buyer-onboarding');
    };

    completeLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">🔄 Logging you in...</p>
    </div>
  );
}
