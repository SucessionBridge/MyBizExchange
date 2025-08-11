// pages/api/send-message.js
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // formidable handles multipart
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY; // recommended (bypasses RLS server-side)
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // fallback
const BUCKET = 'message-attachments';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY);

function ok(res, payload) { res.status(200).json({ ok: true, ...payload }); }
function bad(res, msg, code = 400) { res.status(code).json({ ok: false, error: msg }); }

const isImage = (m) => typeof m === 'string' && m.startsWith('image/');
const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const safeName = (n = '') => String(n).replace(/[^\w.\-]+/g, '_').slice(-180) || `file_${Date.now()}`;

// ---------- normalization helpers (prevent "null" string in UUID/text) ----------
function norm(v) {
  const s = (v ?? '').toString().trim();
  if (!s) return null;
  const lo = s.toLowerCase();
  return (lo === 'null' || lo === 'undefined') ? null : s;
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function asUUID(v) {
  const s = norm(v);
  return s && UUID_RE.test(s) ? s : null;
}

/** Upload one file to Storage using Buffer (avoids Node18 duplex) */
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
  if (error) {
    console.warn('Storage upload failed:', error.message);
    return null;
  }
  return {
    path,
    name: file.originalFilename || base,
    size: file.size || buffer.length || null,
    mime: mime || null,
    kind,
  };
}

async function parseMultipart(req) {
  const form = formidable({ multiples: true, keepExtensions: true });
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
  });
  return { fields, files };
}

/** Try to resolve seller_id if only seller_email provided */
async function resolveSellerId({ listing_id, seller_email }) {
  if (!seller_email) return null;

  // 1) try the seller row with this email
  const { data: byEmail } = await supabase
    .from('sellers')
    .select('id,email')
    .eq('email', seller_email)
    .limit(1)
    .maybeSingle();
  if (byEmail?.id) return byEmail.id;

  // 2) fallback: use the listing row itself (id == listing_id)
  if (listing_id) {
    const { data: listingRow } = await supabase
      .from('sellers')
      .select('id,email')
      .eq('id', listing_id)
      .limit(1)
      .maybeSingle();
    if (listingRow?.id) return listingRow.id;
  }
  return null;
}

/** Insert into messages using ONLY safe columns that exist everywhere */
async function insertMessage({
  listing_id,
  buyer_email,
  buyer_name,
  seller_id,        // optional UUID
  sender_id,        // optional UUID (who sent)
  message,
  topic = 'business-inquiry',
  is_deal_proposal = false,
  attachments = [],
}) {
  const row = {
    listing_id,
    message: message || '',
    topic,
    is_deal_proposal: Boolean(is_deal_proposal),
    attachments, // JSONB
  };
  if (buyer_email) row.buyer_email = buyer_email;
  if (buyer_name) row.buyer_name = buyer_name;
  if (seller_id)  row.seller_id  = seller_id;
  if (sender_id)  row.sender_id  = sender_id;

  const { error, data } = await supabase.from('messages').insert([row]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  try {
    const contentType = req.headers['content-type'] || '';

    // -------- MULTIPART CALLERS ----------
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);

      const listing_id       = norm(fields.listing_id ?? fields.listingId);
      const buyer_email      = norm(fields.buyer_email);
      const buyer_name       = norm(fields.buyer_name);
      const message          = norm(fields.message);
      const topic            = norm(fields.topic) || 'business-inquiry';
      const is_deal_proposal = ['true','1','yes'].includes((fields.is_deal_proposal ?? '').toString().toLowerCase());
      const sender_id        = asUUID(fields.sender_id);

      if (!listing_id) return bad(res, 'Missing listing_id');

      const seller_email = norm(fields.seller_email);
      const actorRole = fields.actor_role?.toString() ||
        (buyer_email && !seller_email ? 'buyer' : 'seller');
      const actorEmail = actorRole === 'seller' ? (seller_email || 'seller') : (buyer_email || 'buyer');

      // Normalize files array
      const raw = files.attachments || files.attachment || files.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];

      // Upload attachments (if service key present)
      const attachments = [];
      if (uploads.length) {
        if (!SERVICE_KEY) {
          console.warn('No SERVICE ROLE key; skipping file uploads. Message will be text-only.');
        } else {
          for (const f of uploads) {
            const att = await uploadOne({ file: f, listingId: listing_id, actorEmail, actorRole });
            if (att) attachments.push(att);
          }
        }
      }

      // Resolve seller_id if provided via field, else attempt via seller_email/listing
      let seller_id = asUUID(fields.seller_id);
      if (!seller_id) {
        seller_id = await resolveSellerId({ listing_id, seller_email });
      }

      const row = await insertMessage({
        listing_id,
        buyer_email,
        buyer_name,
        seller_id,
        sender_id,
        message,
        topic,
        is_deal_proposal,
        attachments,
      });

      return ok(res, { message: row, uploaded: attachments.length });
    }

    // -------- JSON CALLERS ----------
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
      req.on('error', reject);
    });

    const {
      listing_id, listingId,
      buyer_email, buyer_name,
      seller_id, seller_email,
      sender_id,
      message, topic, is_deal_proposal,
      attachments = [], // already-uploaded {path,name,size,mime,kind}
    } = body || {};

    const lid   = norm(listing_id ?? listingId);
    if (!lid) return bad(res, 'Missing listing_id');

    let sid     = asUUID(seller_id);
    const sMail = norm(seller_email);
    if (!sid && sMail) sid = await resolveSellerId({ listing_id: lid, seller_email: sMail });

    const snd   = asUUID(sender_id);
    const bMail = norm(buyer_email);
    const bName = norm(buyer_name);
    const msg   = norm(message);
    const top   = norm(topic) || 'business-inquiry';
    const deal  = Boolean(is_deal_proposal);

    // Accept only image/video attachments
    const safeAtt = (Array.isArray(attachments) ? attachments : [])
      .filter(a => a && typeof a === 'object')
      .map(a => ({
        path: a.path,
        name: a.name,
        size: a.size ?? null,
        mime: a.mime ?? null,
        kind: a.kind && (a.kind === 'image' || a.kind === 'video') ? a.kind
            : (isImage(a.mime) ? 'image' : isVideo(a.mime) ? 'video' : 'other'),
      }))
      .filter(a => a.kind === 'image' || a.kind === 'video');

    const row = await insertMessage({
      listing_id: lid,
      buyer_email: bMail,
      buyer_name:  bName,
      seller_id:   sid,
      sender_id:   snd,
      message:     msg,
      topic:       top,
      is_deal_proposal: deal,
      attachments: safeAtt,
    });

    return ok(res, { message: row, uploaded: 0 });
  } catch (err) {
    console.error('send-message error:', err);
    return bad(res, 'Failed to send message', 500);
  }
}
