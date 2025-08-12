// pages/api/send-message.js
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = 'message-attachments';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY);

const ok  = (res, payload) => res.status(200).json({ ok: true,  ...payload });
const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

// logging
const log = (...a) => console.log('[send-message]', ...a);
const err = (...a) => console.error('[send-message]', ...a);

// helpers
const first = (v) => Array.isArray(v) ? v[0] : v;
const coerceNull = (v) => {
  const x = first(v);
  if (x === undefined || x === null) return null;
  if (typeof x === 'string') {
    const t = x.trim();
    if (t === '' || t.toLowerCase() === 'null') return null;
    return t;
  }
  return x;
};
// number | "72" | ["72"] | "[\"72\"]" → 72
function normalizeInt(val) {
  let v = first(val);
  try {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s.startsWith('[') && s.endsWith(']')) {
        const parsed = JSON.parse(s);
        v = first(parsed);
      } else {
        v = s;
      }
    }
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

const isImage = (m) => typeof m === 'string' && m.startsWith('image/');
const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const safeName = (n = '') => String(n).replace(/[^\w.\-]+/g, '_').slice(-180) || `file_${Date.now()}`;
const isUUID = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
// 👇 simple truthy helper (so "true", "1", "yes" all work)
const truthy = (v) => ['true','1','yes','on'].includes(String(first(v)).toLowerCase());

/** Resolve the *UUID* to store in messages.seller_id (NOT integer listing id) */
async function resolveSellerUUID({ listing_id, seller_email }) {
  // 1) sellers.auth_id by email
  if (seller_email) {
    const { data: byEmail, error: e1 } = await supabase
      .from('sellers')
      .select('auth_id')
      .eq('email', seller_email)
      .not('auth_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (!e1 && byEmail?.auth_id && isUUID(byEmail.auth_id)) return byEmail.auth_id;
  }

  // 2) sellers.auth_id by listing row id (int)
  if (listing_id != null) {
    const { data: byListing, error: e2 } = await supabase
      .from('sellers')
      .select('auth_id')
      .eq('id', listing_id)
      .not('auth_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (!e2 && byListing?.auth_id && isUUID(byListing.auth_id)) return byListing.auth_id;
  }

  // 3) fallback: auth.users by email (only with service role)
  if (seller_email && SERVICE_KEY) {
    const { data: authUser, error: e3 } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', seller_email)
      .limit(1)
      .maybeSingle();
    if (!e3 && authUser?.id && isUUID(authUser.id)) return authUser.id;
  }

  return null;
}

async function uploadOne({ file, listingId, actorEmail, actorRole }) {
  const mime = file.mimetype || file.mime || '';
  const kind = isImage(mime) ? 'image' : isVideo(mime) ? 'video' : 'other';
  if (kind === 'other') return null;

  const base = safeName(file.originalFilename || 'upload.bin');
  const dir = actorRole === 'seller'
    ? `listing-${listingId}/seller-${actorEmail}`
    : `listing-${listingId}/buyer-${actorEmail}`;
  const path = `${dir}/${Date.now()}-${base}`;

  const buffer = await fs.promises.readFile(file.filepath);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime || 'application/octet-stream',
    upsert: false,
  });
  if (error) { err('storage upload failed:', error.message); return null; }
  return { path, name: file.originalFilename || base, size: file.size || buffer.length || null, mime: mime || null, kind };
}

async function parseMultipart(req) {
  const form = formidable({ multiples: true, keepExtensions: true });
  return await new Promise((resolve, reject) => {
    form.parse(req, (e, fields, files) => e ? reject(e) : resolve({ fields, files }));
  });
}

async function insertMessage(row) {
  log('INSERT row:', row);
  const { error, data } = await supabase.from('messages').insert([row]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function handler(req, res) {
  const contentType = req.headers['content-type'] || '';
  log('REQUEST', { method: req.method, contentType });

  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  try {
    // ---------- MULTIPART ----------
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);
      log('FIELDS (raw):', fields);

      const listing_id   = normalizeInt(fields.listing_id ?? fields.listingId);
      const buyer_email  = coerceNull(fields.buyer_email);
      const buyer_name   = coerceNull(fields.buyer_name);
      const seller_email = coerceNull(fields.seller_email);
      const message      = (coerceNull(fields.message) ?? '').toString();
      const topic        = (coerceNull(fields.topic) || 'business-inquiry').toString();
      const is_deal_proposal = truthy(fields.is_deal_proposal);

      if (!listing_id) return bad(res, 'Invalid listing_id');

      // who is sending? (default buyer unless explicitly marked)
      const explicitFromSeller =
        truthy(fields.from_seller) ||
        String(first(fields.actor) || '').toLowerCase() === 'seller';
      const actorIsSeller = explicitFromSeller;
      const actorRole  = actorIsSeller ? 'seller' : 'buyer';
      const actorEmail = actorIsSeller ? (seller_email || 'seller') : (buyer_email || 'buyer');

      // Resolve seller UUID (required by DB)
      let seller_id = coerceNull(fields.seller_id);
      if (!isUUID(seller_id)) seller_id = null;
      if (!seller_id) seller_id = await resolveSellerUUID({ listing_id, seller_email });
      if (!seller_id) return bad(res, 'Seller account missing auth_id; cannot send message. (Set sellers.auth_id or pass seller_email that maps to an auth user)');

      // attachments
      const raw = files.attachments || files.attachment || files.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const attachments = [];
      if (uploads.length && SERVICE_KEY) {
        for (const f of uploads) {
          const att = await uploadOne({
            file: f,
            listingId: listing_id,
            actorEmail,
            actorRole,
          });
          if (att) attachments.push(att);
        }
      }

      const row = {
        listing_id,
        seller_id,                 // UUID, NOT NULL
        message,
        topic,
        is_deal_proposal: Boolean(is_deal_proposal),
        attachments,
        from_seller: actorIsSeller, // 👈 mark direction
      };
      if (buyer_email) row.buyer_email = buyer_email;
      if (buyer_name)  row.buyer_name  = buyer_name;

      const out = await insertMessage(row);
      return ok(res, { message: out, uploaded: attachments.length });
    }

    // ---------- JSON ----------
    const bodyText = await new Promise((resolve, reject) => {
      let data = ''; req.on('data', c => data += c);
      req.on('end', () => resolve(data || '{}')); req.on('error', reject);
    });
    log('JSON body (raw):', bodyText);

    let body; try { body = JSON.parse(bodyText); } catch { return bad(res, 'Invalid JSON'); }

    const listing_id   = normalizeInt(body.listing_id ?? body.listingId);
    const buyer_email  = coerceNull(body.buyer_email);
    const buyer_name   = coerceNull(body.buyer_name);
    const seller_email = coerceNull(body.seller_email);
    const message      = (coerceNull(body.message) ?? '').toString();
    const topic        = (coerceNull(body.topic) || 'business-inquiry').toString();
    const is_deal_proposal = Boolean(body.is_deal_proposal);

    if (!listing_id) return bad(res, 'Invalid listing_id');

    // who is sending? (default buyer unless explicitly marked)
    const explicitFromSeller =
      body.from_seller === true ||
      String(body.actor || '').toLowerCase() === 'seller';
    const actorIsSeller = explicitFromSeller;

    // Resolve seller UUID (required by DB)
    let seller_id = coerceNull(body.seller_id);
    if (!isUUID(seller_id)) seller_id = null;
    if (!seller_id) seller_id = await resolveSellerUUID({ listing_id, seller_email });
    if (!seller_id) return bad(res, 'Seller account missing auth_id; cannot send message. (Set sellers.auth_id or pass seller_email that maps to an auth user)');

    const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
      .filter(a => a && typeof a === 'object')
      .map(a => ({
        path: a.path, name: a.name, size: a.size ?? null, mime: a.mime ?? null,
        kind: (a.kind === 'image' || a.kind === 'video')
          ? a.kind : (isImage(a.mime) ? 'image' : isVideo(a.mime) ? 'video' : 'other'),
      }))
      .filter(a => a.kind === 'image' || a.kind === 'video');

    const row = {
      listing_id,
      seller_id,                 // UUID, NOT NULL
      message,
      topic,
      is_deal_proposal: Boolean(is_deal_proposal),
      attachments,
      from_seller: actorIsSeller, // 👈 mark direction
    };
    if (buyer_email) row.buyer_email = buyer_email;
    if (buyer_name)  row.buyer_name  = buyer_name;

    const out = await insertMessage(row);
    return ok(res, { message: out, uploaded: 0 });
  } catch (e) {
    err('ERROR:', e.message);
    return bad(res, `Failed to send message: ${e.message}`, 500);
  }
}

