// pages/api/buyer/delete-account.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Validate the caller using their access token
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const uid = userData.user.id;
    const { reason, notes } = (req.body || {});

    // Capture email for cleanup & logging
    const { data: buyer } = await supabaseAdmin
      .from('buyers')
      .select('id,email')
      .eq('auth_id', uid)
      .maybeSingle();

    const email = buyer?.email || userData.user.email || null;

    // Optional: store reason on the (now deleted) buyer row OR just before deleting
    if (buyer?.id) {
      await supabaseAdmin
        .from('buyers')
        .update({
          deletion_reason: reason || null,
          deletion_notes: notes || null,
          deleted_at: new Date().toISOString(),
          is_deleted: true
        })
        .eq('id', buyer.id);
    }

    // Delete saved_listings
    await supabaseAdmin
      .from('saved_listings')
      .delete()
      .or(`buyer_auth_id.eq.${uid}${email ? `,buyer_email.eq.${email}` : ''}`);

    // Optional: anonymize messages rather than deleting
    if (email) {
      await supabaseAdmin
        .from('messages')
        .update({ buyer_email: null, buyer_name: 'Deleted Buyer' })
        .eq('buyer_email', email);
    }

    // Delete buyer profile
    await supabaseAdmin.from('buyers').delete().eq('auth_id', uid);

    // Finally, delete the auth user (irreversible)
    await supabaseAdmin.auth.admin.deleteUser(uid);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
