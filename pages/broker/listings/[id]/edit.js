// pages/broker/listings/[id]/edit.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabaseClient';

export default function BrokerEditListing() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listing, setListing] = useState(null);

  const [form, setForm] = useState({
    business_name: '',
    location_city: '',
    location_state: '',
    asking_price: '',
    annual_revenue: '',
    sde: '',
    business_description: '',
    status: '',
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        // Require auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/login?role=broker&next=${encodeURIComponent(`/broker/listings/${id}/edit`)}`);
          return;
        }

        // Get broker row for this user
        const { data: br } = await supabase
          .from('brokers')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (!br?.id) {
          router.replace(`/broker-onboarding?next=${encodeURIComponent(`/broker/listings/${id}/edit`)}`);
          return;
        }

        // Load the listing and ensure it belongs to this broker
        const { data: l, error: lErr } = await supabase
          .from('sellers')
          .select('id, broker_id, business_name, location_city, location_state, asking_price, annual_revenue, sde, business_description, status')
          .eq('id', id)
          .maybeSingle();

        if (lErr) throw lErr;
        if (!l || l.broker_id !== br.id) {
          setError('You do not have access to this listing.');
          setLoading(false);
          return;
        }

        if (!cancelled) {
          setListing(l);
          setForm({
            business_name: l.business_name || '',
            location_city: l.location_city || '',
            location_state: l.location_state || '',
            asking_price: l.asking_price ?? '',
            annual_revenue: l.annual_revenue ?? '',
            sde: l.sde ?? '',
            business_description: l.business_description || '',
            status: l.status || 'draft',
          });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not load listing.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id, router]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!listing?.id) return;
    setSaving(true);
    setError('');

    try {
      const payload = {
        business_name: form.business_name?.trim() || null,
        location_city: form.location_city?.trim() || null,
        location_state: form.location_state?.trim() || null,
        asking_price: form.asking_price === '' ? null : Number(form.asking_price),
        annual_revenue: form.annual_revenue === '' ? null : Number(form.annual_revenue),
        sde: form.sde === '' ? null : Number(form.sde),
        business_description: form.business_description?.trim() || null,
        status: form.status || 'draft',
      };

      const { error: upErr } = await supabase
        .from('sellers')
        .update(payload)
        .eq('id', listing.id);
      if (upErr) throw upErr;

      alert('Listing updated');
      router.push('/broker-dashboard');
    } catch (e) {
      setError(e?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => router.push('/broker-dashboard')} className="mt-4 px-3 py-2 rounded border">
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Listing</h1>
      <form onSubmit={save} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input name="business_name" value={form.business_name} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input name="location_city" value={form.location_city} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State/Province</label>
            <input name="location_state" value={form.location_state} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Asking Price</label>
            <input name="asking_price" type="number" value={form.asking_price} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Annual Revenue</label>
            <input name="annual_revenue" type="number" value={form.annual_revenue} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SDE</label>
            <input name="sde" type="number" value={form.sde} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="business_description" value={form.business_description} onChange={onChange} className="w-full border rounded px-3 py-2 min-h-[140px]" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" value={form.status} onChange={onChange} className="w-full border rounded px-3 py-2">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/broker-dashboard')} className="px-4 py-2 rounded border">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
