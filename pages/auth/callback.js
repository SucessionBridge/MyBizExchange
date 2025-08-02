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

      let access_token, refresh_token;

      if (window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.replace('#', ''));
        access_token = params.get('access_token');
        refresh_token = params.get('refresh_token');
        console.log('🔐 Tokens from hash:', { access_token, refresh_token });

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else {
          console.error('❌ Missing tokens');
          router.replace('/login');
          return;
        }
      } else {
        console.error('❌ No tokens found in URL');
        router.replace('/login');
        return;
      }

      // ✅ Wait for Supabase to emit SIGNED_IN event before redirecting
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Session confirmed, user:', session.user.email);

          const { data: buyer } = await supabase
            .from('buyers')
            .select('name')
            .eq('auth_id', session.user.id)
            .eq('email', session.user.email)
            .maybeSingle();

          if (buyer && buyer.name) {
            router.replace(`/buyer-dashboard?name=${encodeURIComponent(buyer.name)}`);
          } else {
            router.replace('/buyer-onboarding');
          }
        }
      });

      // Cleanup listener on unmount
      return () => listener.subscription.unsubscribe();
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? 'Logging you in...' : 'Redirecting...'}
    </div>
  );
}



