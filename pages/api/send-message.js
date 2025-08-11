// pages/api/send-message.js
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;      // prefer service role (bypasses RLS)
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  // fallback
const BUCKET = 'message-attachments';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY);

const ok  = (res, payload) => res.status(200).json({ ok: true,  ...payload });
const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

// "null"/""/undefined → null
const coerceNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '' || t.toLowerCase() === 'null') return null;
    return t;
  }
  return v;
};

const isImage = (m) => typeof m === 'string' && m.startsWith('image/');
const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const safeName = (n = '') => String(n).replace(/[^\w.\-]+/g, '_').slice(-180) || `file_${Date.now()}`;

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
  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

async function resolveSellerId({ listing_id, seller_email }) {
  if (!seller_email) return null;

  const { data: byEmail } = await supabase
    .from('sellers')
    .select('id,email')
    .eq('email', seller_email)
    .limit(1)
    .maybeSingle();
  if (byEmail?.id) return byEmail.id;

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

async function insertMessage({
  listing_id,
  buyer_email,
  buyer_name,
  seller_id,      // optional
  sender_id,      // optional (uuid of whoever sent)
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
  if (buyer_name)  row.buyer_name  = buyer_name;
  if (seller_id)   row.seller_id   = seller_id;
  if (sender_id)   row.sender_id   = sender_id;

  const { error, data } = await supabase.from('messages').insert([row]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  try {
    const contentType = req.headers['content-type'] || '';

    // ---------- MULTIPART ----------
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);

      const listing_id = coerceNull(fields.listing_id ?? fields.listingId);
      if (!listing_id) return bad(res, 'Missing listing_id');

      const buyer_email = coerceNull(fields.buyer_email);
      const buyer_name  = coerceNull(fields.buyer_name);
      const message     = coerceNull(fields.message) ?? '';
      const topic       = coerceNull(fields.topic) || 'business-inquiry';
      const is_deal_proposal = ['true','1','yes'].includes(String(fields.is_deal_proposal || '').toLowerCase());

      let seller_id     = coerceNull(fields.seller_id);
      const seller_email = coerceNull(fields.seller_email);
      let sender_id     = coerceNull(fields.sender_id);

      if (!seller_id && seller_email) {
        seller_id = await resolveSellerId({ listing_id, seller_email });
      }

      // Upload attachments (images/videos only)
      const raw = files.attachments || files.attachment || files.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const attachments = [];
      if (uploads.length && SERVICE_KEY) {
        for (const f of uploads) {
          const att = await uploadOne({
            file: f,
            listingId: listing_id,
            actorEmail: (sender_id ? 'seller' : (buyer_email || 'buyer')),
            actorRole: sender_id ? 'seller' : 'buyer',
          });
          if (att) attachments.push(att);
        }
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

    // ---------- JSON ----------
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const listing_id  = coerceNull(body.listing_id ?? body.listingId);
    if (!listing_id) return bad(res, 'Missing listing_id');

    const buyer_email = coerceNull(body.buyer_email);
    const buyer_name  = coerceNull(body.buyer_name);
    const message     = coerceNull(body.message) ?? '';
    const topic       = coerceNull(body.topic) || 'business-inquiry';
    const is_deal_proposal = Boolean(body.is_deal_proposal);

    let seller_id     = coerceNull(body.seller_id);
    const seller_email = coerceNull(body.seller_email);
    let sender_id     = coerceNull(body.sender_id);

    if (!seller_id && seller_email) {
      seller_id = await resolveSellerId({ listing_id, seller_email });
    }

    // sanitize attachments
    const safeAtt = (Array.isArray(body.attachments) ? body.attachments : [])
      .filter(a => a && typeof a === 'object')
      .map(a => ({
        path: a.path,
        name: a.name,
        size: a.size ?? null,
        mime: a.mime ?? null,
        kind: (a.kind === 'image' || a.kind === 'video')
          ? a.kind
          : (isImage(a.mime) ? 'image' : isVideo(a.mime) ? 'video' : 'other'),
      }))
      .filter(a => a.kind === 'image' || a.kind === 'video');

    const row = await insertMessage({
      listing_id,
      buyer_email,
      buyer_name,
      seller_id,
      sender_id,
      message,
      topic,
      is_deal_proposal,
      attachments: safeAtt,
    });

    return ok(res, { message: row, uploaded: 0 });
  } catch (err) {
    console.error('send-message error:', err);
    return bad(res, `Failed to send message: ${err.message}`, 500);
  }
}

