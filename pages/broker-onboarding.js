// pages/broker-onboarding.js
import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function BrokerOnboarding() {
  const [form, setForm] = useState({ full_name:'', company:'', phone:'', website:'', license_no:'' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/login?role=broker';
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login?role=broker'; return; }

    let proof_path = null;
    if (file) {
      const key = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('broker-docs').upload(key, file, { upsert:false });
      if (!upErr) proof_path = key;
    }

    const payload = {
      auth_id: user.id,
      email: user.email,
      full_name: form.full_name,
      company: form.company,
      phone: form.phone,
      website: form.website,
      license_no: form.license_no,
      proof_path
    };

    const { error } = await supabase.from('brokers').upsert(payload, { onConflict: 'auth_id' });
    setSaving(false);
    if (!error) window.location.href = '/broker-dashboard';
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Broker Onboarding</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Full name"
          value={form.full_name} onChange={e=>setForm(f=>({...f, full_name:e.target.value}))} />
        <input className="w-full border p-2 rounded" placeholder="Company"
          value={form.company} onChange={e=>setForm(f=>({...f, company:e.target.value}))} />
        <input className="w-full border p-2 rounded" placeholder="Phone"
          value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} />
        <input className="w-full border p-2 rounded" placeholder="Website"
          value={form.website} onChange={e=>setForm(f=>({...f, website:e.target.value}))} />
        <input className="w-full border p-2 rounded" placeholder="License #"
          value={form.license_no} onChange={e=>setForm(f=>({...f, license_no:e.target.value}))} />
        <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <button disabled={saving} className="px-4 py-2 rounded bg-black text-white">
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
