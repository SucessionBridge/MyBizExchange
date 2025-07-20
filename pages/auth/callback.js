// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');

      try {
        // ✅ Complete magic link or OAuth login flow
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession();
        if (sessionError) {
          console.error('❌ Session parsing failed:', sessionError);
          router.replace('/');
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isMounted) return;
        if (userError || !user) {
          console.error('❌ No user found:', userError);
          router.replace('/');
          return;
        }

        console.log('🔐 Logged in user ID:', user.id);

        const { data: profile, error: profileError } = await supabase
          .from('buyers')
          .select('name')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError) {
          console.error('❌ Error fetching buyer profile:', profileError);
          router.replace('/');
          return;
        }

        if (profile && profile.name) {
          // ✅ Redirect to dashboard with name
          const nameParam = encodeURIComponent(profile.name);
          router.replace(`/buyer-dashboard?name=${nameParam}`); // ✅ FIXED
        } else {
          // 🚧 Redirect to onboarding
          router.replace('/buyer-onboarding');
        }
      } catch (err) {
        console.error('🔥 Unexpected error:', err);
        router.replace('/');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700">
      {loading ? 'Logging you in...' : 'Redirecting...'}
    </div>
  );
}
