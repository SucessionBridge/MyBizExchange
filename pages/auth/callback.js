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
        // ✅ Complete magic link login by parsing URL
        const { error: urlError } = await supabase.auth.getSessionFromUrl();
        if (urlError) {
          console.error('❌ Error getting session from URL:', urlError);
          router.replace('/');
          return;
        }

        // ✅ Give Supabase time to sync session
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error || !user) {
          console.error('❌ No user found after login:', error);
          router.replace('/');
          return;
        }

        console.log('🔐 Logged in user:', user.id);

        // 🔍 Check for buyer profile
        const { data: profile, error: profileError } = await supabase
          .from('buyers')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError) {
          console.error('❌ Error fetching buyer profile:', profileError);
          router.replace('/');
          return;
        }

        if (profile) {
          console.log('✅ Buyer profile exists — redirecting to dashboard');
          router.replace('/buyer-dashboard');
        } else {
          console.log('👤 No profile found — redirecting to onboarding');
          router.replace('/buyer-onboarding');
        }
      } catch (err) {
        console.error('🔥 Unexpected error in auth callback:', err);
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

