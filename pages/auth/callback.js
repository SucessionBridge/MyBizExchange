import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');
      console.log('🌐 Full callback URL:', window.location.href);

      let sessionResult;

      if (window.location.hash.includes('access_token')) {
        // ✅ Magic Link or implicit flow
        const params = new URLSearchParams(window.location.hash.replace('#', ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        console.log('🔐 Using implicit flow tokens', { access_token, refresh_token });

        if (access_token && refresh_token) {
          sessionResult = await supabase.auth.setSession({ access_token, refresh_token });
          console.log('📦 setSession result:', sessionResult);
        }
      } else {
        // ✅ Google PKCE flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        console.log('🔄 exchangeCodeForSession result:', data, error);
        sessionResult = { data, error };

        if (error) {
          console.error('❌ Session error:', error.message);
          router.replace('/login');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User after exchange:', user);

      if (!user) {
        console.error('❌ No user found after login');
        router.replace('/login');
        return;
      }

      console.log('✅ Logged in user:', user.email);

      // ✅ Check buyer profile and redirect
      const { data: buyer } = await supabase
        .from('buyers')
        .select('name')
        .eq('auth_id', user.id)
        .eq('email', user.email)
        .maybeSingle();

      console.log('📡 Buyer profile lookup:', buyer);

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



