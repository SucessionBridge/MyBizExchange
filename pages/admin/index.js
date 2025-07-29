import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setIsAdmin(true);
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Access denied</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p>✅ You are logged in as an Admin.</p>
    </div>
  );
}
