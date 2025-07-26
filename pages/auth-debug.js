// pages/auth-debug.js
import { useEffect, useState } from 'react';
import supabase from "../lib/supabaseClient";

export default function AuthDebug() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      console.log('🔍 Supabase getUser result:', data, error);
      setUserInfo({ data, error });
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return <p>Checking Supabase auth...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔐 Auth Debug</h1>
      <pre>{JSON.stringify(userInfo, null, 2)}</pre>
    </div>
  );
}
