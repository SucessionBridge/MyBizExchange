import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('❌ No user found after magic link login:', error);
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('buyers')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profile) {
        console.log('✅ Buyer profile found — redirecting to dashboard');
        router.replace('/buyer/dashboard');
      } else {
        console.log('👤 No profile found — redirecting to onboarding');
        router.replace('/buyers');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700">
      Logging you in...
    </div>
  );
}
