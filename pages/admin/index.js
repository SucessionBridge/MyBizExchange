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

      fetchData();
    };

    checkAdmin();
  }, []);

  const fetchData = async () => {
    const { data: sellerData } = await supabase.from('sellers').select('*');
    const { data: buyerData } = await supabase.from('buyers').select('*');
    setSellers(sellerData || []);
    setBuyers(buyerData || []);
  };

  const deleteSeller = async (id) => {
    await supabase.from('sellers').delete().eq('id', id);
    fetchData();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('sellers').update({ status }).eq('id', id);
    fetchData();
  };

  if (loading) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Access denied</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-8">✅ You are logged in as an Admin.</p>

      {/* Sellers Table */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Sellers</h2>
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                {sellers[0] && Object.keys(sellers[0]).map(key => (
                  <th key={key} className="px-4 py-2 border-b text-left">{key}</th>
                ))}
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b">{String(val)}</td>
                  ))}
                  <td className="px-4 py-2 border-b space-x-2">
                    <button 
                      onClick={() => updateStatus(row.id, 'approved')} 
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => updateStatus(row.id, 'rejected')} 
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => deleteSeller(row.id)} 
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Buyers Table */}
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
              {buyers.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
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
