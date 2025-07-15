// pages/redirect.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectWithSession = async () => {
      // ✅ Wait for Supabase to restore session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        console.warn("⚠️ No active session found");
        router.push("/login");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        console.warn("⚠️ No user email found");
        router.push("/login");
        return;
      }

      const email = user.email;

      // ✅ Check if user is a seller
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('email', email)
        .single();

      if (seller) {
        router.push('/seller-dashboard');
        return;
      }

      // ✅ Check if user is a buyer
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('email', email)
        .single();

      if (buyer) {
        router.push('/listings');
        return;
      }

      // 🚨 Default fallback if user type is unknown
      router.push('/login');
    };

    redirectWithSession();
  }, [router]);

  return (
    <main className="p-6 text-center">
      <p className="text-lg text-gray-600">🔄 Redirecting you to your dashboard...</p>
    </main>
  );
}
