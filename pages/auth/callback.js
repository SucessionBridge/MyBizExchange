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

      // ✅ Exchange code for session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        router.replace('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No user found');
        router.replace('/login');
        return;
      }

      console.log('🔐 Logged in user:', user.email);

      // ✅ Check for seller profile
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (seller) {
        router.replace('/seller-dashboard');
        return;
      }

      // ✅ Check for buyer profile
      const { data: buyer } = await supabase
        .from('buyers')
        .select('name')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (buyer) {
        const nameParam = encodeURIComponent(buyer.name || '');
        router.replace(`/buyer-dashboard?name=${nameParam}`);
      } else {
        router.replace('/buyer-onboarding');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700">
      {loading ? 'Logging you in...' : 'Redirecting...'}
    </div>
  );
}

