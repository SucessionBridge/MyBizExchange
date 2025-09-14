// pages/admin/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [brokers, setBrokers] = useState([]);

  const [searchSellers, setSearchSellers] = useState("");
  const [searchBuyers, setSearchBuyers] = useState("");
  const [searchBrokers, setSearchBrokers] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        router.replace("/");
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
    const [
      { data: sellerData, error: sellerErr },
      { data: buyerData, error: buyerErr },
      { data: brokerData, error: brokerErr },
    ] = await Promise.all([
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("buyers").select("*").order("created_at", { ascending: false }),
      supabase.from("brokers").select("*").order("created_at", { ascending: false }),
    ]);

    if (sellerErr) console.error("Sellers fetch error:", sellerErr.message);
    if (buyerErr) console.error("Buyers fetch error:", buyerErr.message);
    if (brokerErr) console.error("Brokers fetch error:", brokerErr.message);

    setSellers(sellerData || []);
    setBuyers(buyerData || []);
    setBrokers(brokerData || []);
  };

  // --- Actions: Sellers ---
  const updateSellerStatus = async (id, status) => {
    const { error } = await supabase.from("sellers").update({ status }).eq("id", id);
    if (error) {
      alert("Update failed: " + error.message);
      return;
    }
    fetchData();
  };

  const deleteSeller = async (id) => {
    if (!confirm("Delete this seller listing permanently?")) return;
    const { error } = await supabase.from("sellers").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    fetchData();
  };

  // --- Actions: Buyers ---
  const deleteBuyer = async (id) => {
    if (!confirm("Delete this buyer permanently?")) return;
    const { error } = await supabase.from("buyers").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    fetchData();
  };

  // --- Actions: Brokers ---
  // Tries boolean "verified" first. If that column doesn't exist, falls back to text "status".
  const updateBrokerStatus = async (id, action) => {
    const desiredVerified = action === "verify";

    // Attempt #1: update boolean verified
    let { error } = await supabase
      .from("brokers")
      .update({ verified: desiredVerified })
      .eq("id", id);

    // If "verified" column doesn't exist, fall back to a text status column
    if (error && /column .*verified/i.test(error.message)) {
      const statusVal = action === "verify" ? "verified" : "rejected";
      const res2 = await supabase.from("brokers").update({ status: statusVal }).eq("id", id);
      error = res2.error;
    }

    if (error) {
      console.error("Broker verify/reject error:", error.message);
      alert("Update failed: " + error.message);
      return;
    }
    fetchData();
  };

  const deleteBroker = async (id) => {
    if (!confirm("Delete this broker permanently?")) return;
    const { error } = await supabase.from("brokers").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    fetchData();
  };

  // --- Helpers ---
  const renderStatusBadge = (status) => {
    const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
    switch ((status || "").toLowerCase()) {
      case "active":
      case "approved":
      case "verified":
        return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
      case "rejected":
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status}</span>;
      case "deleted":
        return <span className={`${base} bg-red-100 text-red-700`}>{status}</span>;
      case "pending":
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>{status || "pending"}</span>;
    }
  };

  const computedBrokerStatus = (row) => {
    if (row.status) return String(row.status);
    if (typeof row.verified === "boolean") return row.verified ? "verified" : "rejected";
    return "pending";
  };

  const filterData = (rows, query) => {
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  if (loading) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Access denied</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="mb-8">✅ You are logged in as an Admin.</p>

      {/* Sellers */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Sellers</h2>
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchSellers}
            onChange={(e) => setSearchSellers(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </div>
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {sellers[0] &&
                  Object.keys(sellers[0]).map((key) => (
                    <th key={key} className="px-4 py-2 border-b text-left">
                      {key}
                    </th>
                  ))}
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterData(sellers, searchSellers).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 align-top">
                  {Object.entries(row).map(([key, val]) => (
                    <td key={key} className="px-4 py-2 border-b">
                      {key === "status" ? renderStatusBadge(val) : String(val)}
                    </td>
                  ))}
                  <td className="px-4 py-2 border-b whitespace-nowrap space-x-2">
                    <button
                      onClick={() => updateSellerStatus(row.id, "active")}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => updateSellerStatus(row.id, "rejected")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => deleteSeller(row.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filterData(sellers, searchSellers).length === 0 && (
                <tr>
                  <td colSpan="100%" className="px-4 py-6 text-center text-gray-600">
                    No seller records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Buyers */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Buyers</h2>
          <input
            type="text"
            placeholder="Search buyers..."
            value={searchBuyers}
            onChange={(e) => setSearchBuyers(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </div>
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {buyers[0] &&
                  Object.keys(buyers[0]).map((key) => (
                    <th key={key} className="px-4 py-2 border-b text-left">
                      {key}
                    </th>
                  ))}
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterData(buyers, searchBuyers).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b">{String(val)}</td>
                  ))}
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => deleteBuyer(row.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filterData(buyers, searchBuyers).length === 0 && (
                <tr>
                  <td colSpan="100%" className="px-4 py-6 text-center text-gray-600">
                    No buyer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Brokers */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Brokers</h2>
          <input
            type="text"
            placeholder="Search brokers..."
            value={searchBrokers}
            onChange={(e) => setSearchBrokers(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </div>
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {/* Show all columns from the record */}
                {brokers[0] &&
                  Object.keys(brokers[0]).map((key) => (
                    <th key={key} className="px-4 py-2 border-b text-left">
                      {key}
                    </th>
                  ))}
                {/* Always include a visible Status column for clarity */}
                <th className="px-4 py-2 border-b text-left">status</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterData(brokers, searchBrokers).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {Object.entries(row).map(([key, val]) => (
                    <td key={key} className="px-4 py-2 border-b">
                      {String(val)}
                    </td>
                  ))}
                  {/* Computed status badge even if the table has no "status" column */}
                  <td className="px-4 py-2 border-b">
                    {renderStatusBadge(computedBrokerStatus(row))}
                  </td>
                  <td className="px-4 py-2 border-b whitespace-nowrap space-x-2">
                    <button
                      onClick={() => updateBrokerStatus(row.id, "verify")}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => updateBrokerStatus(row.id, "reject")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => deleteBroker(row.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filterData(brokers, searchBrokers).length === 0 && (
                <tr>
                  <td colSpan="100%" className="px-4 py-6 text-center text-gray-600">
                    No broker records found.
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

