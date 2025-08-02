
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

      // ✅ Handle implicit flow (#access_token) for Magic Link
      if (window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.replace('#', ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        console.log('🔐 Using implicit flow tokens');

        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token
          });
        }
      } else {
        // ✅ Standard PKCE code exchange flow (Google OAuth)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('❌ Session error:', error.message);
          router.replace('/login');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Logged in user ID:', user?.id);
      console.log('✅ Logged in user Email:', user?.email);

      if (!user) {
        console.error('❌ No user found after login');
        router.replace('/login');
        return;
      }

      // ✅ Case-insensitive email match + auth_id OR email fallback
      const { data: buyer } = await supabase
        .from('buyers')
        .select('name, auth_id, email')
        .or(`auth_id.eq.${user.id},email.ilike.${user.email}`)
        .maybeSingle();

      console.log('🧪 Buyer profile lookup result:', buyer);

      if (buyer) {
        console.log('🔍 DB auth_id:', buyer.auth_id);
        console.log('🔍 DB email:', buyer.email);
      } else {
        console.log('⚠️ No matching buyer found');
      }

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
