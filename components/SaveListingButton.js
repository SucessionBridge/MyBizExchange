import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Props:
 *  - listingId: number | string (required)
 *  - className?: string
 */
export default function SaveListingButton({ listingId, className = '' }) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [existingRow, setExistingRow] = useState(null); // row from saved_listings if any
  const isSaved = useMemo(() => !!existingRow, [existingRow]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setChecking(true);
      // 1) Load auth
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user || null;
      if (cancelled) return;
      setAuthUser(user);

      // 2) If not logged in or no listing id, stop
      if (!user || !listingId) {
        setExistingRow(null);
        setChecking(false);
        return;
      }

      // 3) Check if saved (by auth id OR buyer email)
      const eqListing = String(listingId); // normalize
      const { data, error } = await supabase
        .from('saved_listings')
        .select('*')
        .eq('listing_id', eqListing)
        .or(`buyer_auth_id.eq.${user.id},buyer_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (cancelled) return;

      if (error) {
        console.warn('Saved check failed:', error.message);
        setExistingRow(null);
      } else {
        setExistingRow(Array.isArray(data) && data.length > 0 ? data[0] : null);
      }
      setChecking(false);
    };

    init();
    return () => { cancelled = true; };
  }, [listingId]);

  async function handleClick() {
    if (!listingId) {
      toast.error('Missing listing ID.');
      return;
    }

    // Not logged in? send to login and back
    if (!authUser) {
      const next = router.asPath || `/listings/${listingId}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    // Toggle
    if (!isSaved) {
      // Save
      const payload = {
        listing_id: listingId,
        buyer_auth_id: authUser.id,
        buyer_email: authUser.email,
      };

      const { data, error } = await supabase.from('saved_listings').insert([payload]).select().single();
      if (error) {
        console.error('Save failed:', error);
        toast.error('Could not save listing.');
        return;
      }
      setExistingRow(data);
      toast.success('Saved to your profile.');
    } else {
      // Unsave by row id (most reliable)
      if (!existingRow?.id) {
        toast.error('Could not unsave — missing row id.');
        return;
      }
      const { error } = await supabase.from('saved_listings').delete().eq('id', existingRow.id);
      if (error) {
        console.error('Unsave failed:', error);
        toast.error('Could not remove from saved.');
        return;
      }
      setExistingRow(null);
      toast('Removed from saved.', { icon: '🗑️' });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking}
      aria-pressed={isSaved}
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border transition',
        checking
          ? 'opacity-60 cursor-wait bg-gray-100 text-gray-500 border-gray-200'
          : isSaved
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
            : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300',
        className
      ].join(' ')}
    >
      {checking ? 'Checking…' : isSaved ? '✓ Saved' : '☆ Save'}
    </button>
  );
}
