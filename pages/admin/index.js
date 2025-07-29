import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]);

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

      if (!data) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);

      // Fetch sellers and buyers after admin check
      const { data: sellerData } = await supabase.from('sellers').select('*');
      const { data: buyerData } = await supabase.from('buyers').select('*');
      setSellers(sellerData || []);
      setBuyers(buyerData || []);
    };

    checkAdmin();
  }, []);

  if (loading) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Access denied</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-8">✅ You are logged in as an Admin.</p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Sellers</h2>
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                {sellers[0] && Object.keys(sellers[0]).map(key => (
                  <th key={key} className="px-4 py-2 border-b text-left">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sellers.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Buyers</h2>
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                {buyers[0] && Object.keys(buyers[0]).map(key => (
                  <th key={key} className="px-4 py-2 border-b text-left">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buyers.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
