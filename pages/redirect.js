import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserTypeAndRedirect = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Auth error:", authError);
        router.push('/login');
        return;
      }

      const email = user.email;

      // Check if user is a seller
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single();

      if (seller) {
        router.push('/seller-dashboard');
        return;
      }

      // Check if user is a buyer
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single();

      if (buyer) {
        router.push('/listings');
        return;
      }

      // Default if no match found
      router.push('/login');
    };

    checkUserTypeAndRedirect();
  }, [router]);

  return (
    <main className="p-6 text-center">
      <p className="text-lg text-gray-600">🔄 Redirecting you to your dashboard...</p>
    </main>
  );
}
