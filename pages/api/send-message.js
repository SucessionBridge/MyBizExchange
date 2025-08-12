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

// tiny helpers
const ok  = (res, payload) => res.status(200).json({ ok: true,  ...payload });
const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

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
const isUUID = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const isImage = (m) => typeof m === 'string' && m.startsWith('image/');
const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const safeName = (n = '') => String(n).replace(/[^\w.\-]+/g, '_').slice(-180) || `file_${Date.now()}`;

// infer a boolean from various inputs
function parseFromSeller(input, buyer_email) {
  if (input === true || input === false) return input;
  const s = String(input || '').toLowerCase();
  if (['true','1','yes','seller'].includes(s)) return true;
  if (['false','0','no','buyer'].includes(s)) return false;
  // default: if we see a buyer_email on the request, treat it as a BUYER send
  return buyer_email ? false : true;
}

/** seller_id must be the seller's auth UUID */
async function resolveSellerUUID({ listing_id, seller_email }) {
  if (seller_email) {
    const { data } = await supabase
      .from('sellers')
      .select('auth_id')
      .eq('email', seller_email)
      .not('auth_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (data?.auth_id && isUUID(data.auth_id)) return data.auth_id;
  }
  if (listing_id != null) {
    const { data } = await supabase
      .from('sellers')
      .select('auth_id')
      .eq('id', listing_id)
      .not('auth_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (data?.auth_id && isUUID(data.auth_id)) return data.auth_id;
  }
  if (seller_email && SERVICE_KEY) {
    const { data } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', seller_email)
      .limit(1)
      .maybeSingle();
    if (data?.id && isUUID(data.id)) return data.id;
  }
  return null;
}

async function uploadOne({ file, listingId, actorEmail, actorRole }) {
  const mime = file.mimetype || file.mime || '';
  const kind = isImage(mime) ? 'image' : isVideo(mime) ? 'video' : 'other';
  if (kind === 'other') return null;

  const base = safeName(file.originalFilename || 'upload.bin');
  const dir = actorRole === 'seller'
    ? `listing-${listingId}/seller-${actorEmail || 'seller'}`
    : `listing-${listingId}/buyer-${actorEmail || 'buyer'}`;
  const path = `${dir}/${Date.now()}-${base}`;

  const buffer = await fs.promises.readFile(file.filepath);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, name: file.originalFilename || base, size: file.size || buffer.length || null, mime: mime || null, kind };
}

async function parseMultipart(req) {
  const form = formidable({ multiples: true, keepExtensions: true });
  return await new Promise((resolve, reject) => {
    form.parse(req, (e, fields, files) => e ? reject(e) : resolve({ fields, files }));
  });
}

export default async function handler(req, res) {
  const contentType = req.headers['content-type'] || '';
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  try {
    // ---------- MULTIPART ----------
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);

      const listing_id   = normalizeInt(fields.listing_id ?? fields.listingId);
      const buyer_email  = coerceNull(fields.buyer_email);
      const buyer_name   = coerceNull(fields.buyer_name);
      const seller_email = coerceNull(fields.seller_email);
      const message      = (coerceNull(fields.message) ?? '').toString();
      const topic        = (coerceNull(fields.topic) || 'business-inquiry').toString();
      const is_deal_proposal = ['true','1','yes'].includes(String(first(fields.is_deal_proposal) || '').toLowerCase());
      if (!listing_id) return bad(res, 'Invalid listing_id');

      let seller_id = coerceNull(fields.seller_id);
      if (!isUUID(seller_id)) seller_id = null;
      if (!seller_id) seller_id = await resolveSellerUUID({ listing_id, seller_email });
      if (!seller_id) return bad(res, 'Missing seller auth account (seller_id).');

      // infer who sent it
      const sender   = (coerceNull(fields.sender) || coerceNull(fields.sender_role) || '').toString().toLowerCase();
      const from_seller = parseFromSeller(fields.from_seller ?? sender, buyer_email);

      // attachments
      const raw = files.attachments || files.attachment || files.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const attachments = [];
      for (const f of uploads) {
        const att = await uploadOne({
          file: f,
          listingId: listing_id,
          actorEmail: buyer_email,
          actorRole: from_seller ? 'seller' : 'buyer',
        });
        if (att) attachments.push(att);
      }

      const row = {
        listing_id,
        seller_id,
        buyer_email: buyer_email || null,
        buyer_name : buyer_name  || null,
        message,
        topic,
        is_deal_proposal: Boolean(is_deal_proposal),
        attachments,
        from_seller, // ✅ WRITE THE FLAG
      };

      const { error, data } = await supabase.from('messages').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return ok(res, { message: data, uploaded: attachments.length });
    }

    // ---------- JSON ----------
    // (plain fetch with JSON body)
    const bodyText = await new Promise((resolve, reject) => {
      let data = ''; req.on('data', c => data += c);
      req.on('end', () => resolve(data || '{}')); req.on('error', reject);
    });

    let body; try { body = JSON.parse(bodyText); } catch { return bad(res, 'Invalid JSON'); }

    const listing_id   = normalizeInt(body.listing_id ?? body.listingId);
    const buyer_email  = coerceNull(body.buyer_email);
    const buyer_name   = coerceNull(body.buyer_name);
    const seller_email = coerceNull(body.seller_email);
    const message      = (coerceNull(body.message) ?? '').toString();
    const topic        = (coerceNull(body.topic) || 'business-inquiry').toString();
    const is_deal_proposal = Boolean(body.is_deal_proposal);
    if (!listing_id) return bad(res, 'Invalid listing_id');

    let seller_id = coerceNull(body.seller_id);
    if (!isUUID(seller_id)) seller_id = null;
    if (!seller_id) seller_id = await resolveSellerUUID({ listing_id, seller_email });
    if (!seller_id) return bad(res, 'Missing seller auth account (seller_id).');

    const sender   = (coerceNull(body.sender) || coerceNull(body.sender_role) || '').toString().toLowerCase();
    const from_seller = parseFromSeller(body.from_seller ?? sender, buyer_email);

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
      seller_id,
      buyer_email: buyer_email || null,
      buyer_name : buyer_name  || null,
      message,
      topic,
      is_deal_proposal: Boolean(is_deal_proposal),
      attachments,
      from_seller, // ✅ WRITE THE FLAG
    };

    const { error, data } = await supabase.from('messages').insert([row]).select().single();
    if (error) throw new Error(error.message);
    return ok(res, { message: data, uploaded: attachments.length });
  } catch (e) {
    return bad(res, `Failed to send message: ${e.message}`, 500);
  }
}
