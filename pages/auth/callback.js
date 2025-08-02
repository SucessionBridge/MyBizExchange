import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('📍 Entered /auth/callback');

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error('❌ Session error:', error.message);
        router.replace('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Logged in user:', user);

      if (user) {
        // ✅ Check buyer profile and redirect
        const { data: buyer } = await supabase
          .from('buyers')
          .select('name')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (buyer && buyer.name) {
          router.replace(`/buyer-dashboard?name=${encodeURIComponent(buyer.name)}`);
        } else {
          router.replace('/buyer-onboarding');
        }
      } else {
        router.replace('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}



