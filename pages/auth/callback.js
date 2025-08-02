// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');
      console.log("🌐 Full callback URL:", window.location.href);
      console.log('🔑 Domain:', window.location.origin);

      // ✅ Check existing session before exchange
      const { data: currentSession } = await supabase.auth.getSession();
      console.log('🧪 Current Session BEFORE exchange:', currentSession);

      // ✅ FIX: Pass the full URL to exchangeCodeForSession
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error('❌ Session error:', error.message);
        router.replace('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('🧪 Current User AFTER exchange:', user);

      if (!user) {
        console.error('❌ No user found after login');
        router.replace('/login');
        return;
      }

      console.log('✅ Logged in user:', user.email);

      const { data: buyer } = await supabase
        .from('buyers')
        .select('name')
        .eq('auth_id', user.id)
        .eq('email', user.email)
        .maybeSingle();

      if (buyer && buyer.name) {
        router.replace(`/buyer-dashboard?name=${encodeURIComponent(buyer.name)}`);
      } else {
        router.replace('/buyer-onboarding');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? 'Logging you in...' : 'Redirecting...'}
    </div>
  );
}
