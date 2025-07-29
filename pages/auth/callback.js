// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');

      // ✅ Wait for query params to exist (fixes code verifier issue)
      if (!router.isReady) return;

      try {
        // ✅ Exchange code for session (magic link / OAuth)
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession();
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          router.replace('/login');
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (userError || !user) {
          console.error('❌ No user found:', userError);
          router.replace('/login');
          return;
        }

        console.log('✅ Logged in user:', user.email, user.id);

        // ✅ Look for buyer profile by auth_id
        const { data: profile } = await supabase
          .from('buyers')
          .select('name')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profile && profile.name) {
          // ✅ Redirect to dashboard with name
          const nameParam = encodeURIComponent(profile.name);
          router.replace(`/buyer-dashboard?name=${nameParam}`);
        } else {
          // 🚧 No profile, send to onboarding
          router.replace('/buyer-onboarding');
        }
      } catch (err) {
        console.error('🔥 Unexpected error:', err);
        router.replace('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [router.isReady]); // ✅ important: wait until router is ready

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700">
      {loading ? 'Logging you in...' : 'Redirecting...'}
    </div>
  );
}

