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

      const url = window.location.href;

      try {
        if (url.includes('#access_token')) {
          // ✅ Implicit flow (Google)
          const params = new URLSearchParams(url.split('#')[1]);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('🔐 Setting session from hash tokens');
            await supabase.auth.setSession({ access_token, refresh_token });
          } else {
            console.error('❌ Missing tokens in implicit flow');
            router.replace('/login');
            return;
          }
        } else if (url.includes('?code=')) {
          // ✅ PKCE flow (Magic Link)
          console.log('🔄 Exchanging PKCE code for session');
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('❌ exchangeCodeForSession error:', error.message);
            router.replace('/login');
            return;
          }
        } else {
          console.error('❌ No auth tokens or code in URL');
          router.replace('/login');
          return;
        }

        // ✅ After session set, get user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('✅ Logged in user:', user);

        if (!user) {
          router.replace('/login');
          return;
        }

        // ✅ Check buyer profile
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
      } finally {
        setLoading(false);
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
