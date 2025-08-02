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

      try {
        // ✅ Handle implicit flow with access_token in hash
        if (window.location.hash.includes('access_token')) {
          const params = new URLSearchParams(window.location.hash.replace('#', ''));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('🔐 Using implicit flow tokens');
            await supabase.auth.setSession({
              access_token,
              refresh_token
            });
          }
        } else {
          // ✅ PKCE Code Flow
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            console.error('❌ Session error:', error.message);
            router.replace('/login');
            return;
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log('✅ Logged in user:', user);

        if (!user) {
          console.error('❌ No user found after login');
          router.replace('/login');
          return;
        }

        // ✅ Check if buyer profile exists
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
      } catch (err) {
        console.error('❌ Callback error:', err.message);
        router.replace('/login');
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


