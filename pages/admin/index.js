// pages/admin/index.js
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
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        router.replace('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      fetchData();
    };

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    const [{ data: sellerData }, { data: buyerData }] = await Promise.all([
      supabase.from('sellers').select('*').order('created_at', { ascending: false }),
      supabase.from('buyers').select('*').order('created_at', { ascending: false })
    ]);
    setSellers(sellerData || []);
    setBuyers(buyerData || []);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('sellers').update({ status }).eq('id', id);
    fetchData();
  };

  const deleteSeller = async (id) => {
    const ok = confirm('Delete this listing permanently? This cannot be undone.');
    if (!ok) return;
    await supabase.from('sellers').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Access denied</p>;

  const renderStatusBadge = (status) => {
    const base = 'inline-block px-2 py-0.5 rounded text-xs font-semibold';
    switch ((status || '').toLowerCase()) {
      case 'active':
        return <span className={`${base} bg-green-100 text-green-800`}>active</span>;
      case 'rejected':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>rejected</span>;
      case 'pending':
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>{status || 'pending'}</span>;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="mb-8">✅ You are logged in as an Admin.</p>

      {/* Sellers Table */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Sellers</h2>
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {sellers[0] && Object.keys(sellers[0]).map((key) => (
                  <th key={key} className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                    {key}
                  </th>
                ))}
                <th className="px-4 py-2 border-b text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 align-top">
                  {Object.entries(row).map(([key, val]) => (
                    <td key={key} className="px-4 py-2 border-b text-sm text-gray-800">
                      {key === 'status' ? renderStatusBadge(val) : String(val)}
                    </td>
                  ))}
                  <td className="px-4 py-2 border-b space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => updateStatus(row.id, 'active')}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                      title="Make this listing live on the site"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => updateStatus(row.id, 'rejected')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                      title="Mark as rejected / not live"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => deleteSeller(row.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {sellers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-600" colSpan={sellers[0] ? Object.keys(sellers[0]).length + 1 : 1}>
                    No seller records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Buyers Table */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Buyers</h2>
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {buyers[0] && Object.keys(buyers[0]).map((key) => (
                  <th key={key} className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buyers.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b text-sm text-gray-800">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}

              {buyers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-600" colSpan={buyers[0] ? Object.keys(buyers[0]).length : 1}>
                    No buyer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
