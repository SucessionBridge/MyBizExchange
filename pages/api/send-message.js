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

async function resolveSellerId({ listing_id, seller_email }) {
  if (!seller_email) return null;
  const { data: byEmail } = await supabase
    .from('sellers').select('id,email').eq('email', seller_email).limit(1).maybeSingle();
  if (byEmail?.id) return byEmail.id;

  if (listing_id) {
    const { data: listingRow } = await supabase
      .from('sellers').select('id,email').eq('id', listing_id).limit(1).maybeSingle();
    if (listingRow?.id) return listingRow.id;
  }
  return null;
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

      const listing_id = normalizeInt(fields.listing_id ?? fields.listingId);
      if (!listing_id) return bad(res, 'Invalid listing_id');

      const buyer_email = coerceNull(fields.buyer_email);
      const buyer_name  = coerceNull(fields.buyer_name);
      const message     = coerceNull(fields.message) ?? '';
      const topic       = coerceNull(fields.topic) || 'business-inquiry';
      const is_deal_proposal = ['true','1','yes'].includes(String(first(fields.is_deal_proposal) || '').toLowerCase());

      let seller_id     = coerceNull(fields.seller_id);
      const seller_email = coerceNull(fields.seller_email);
      // NOTE: sender_id is NOT used because your table doesn't have this column

      if (!seller_id && seller_email) {
        seller_id = await resolveSellerId({ listing_id, seller_email });
      }

      // attachments
      const raw = files.attachments || files.attachment || files.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const attachments = [];
      if (uploads.length && SERVICE_KEY) {
        for (const f of uploads) {
          const att = await uploadOne({
            file: f,
            listingId: listing_id,
            actorEmail: buyer_email || 'buyer',
            actorRole: 'buyer',
          });
          if (att) attachments.push(att);
        }
      }

      // build row only with existing columns
      const row = { listing_id, message, topic, is_deal_proposal: Boolean(is_deal_proposal), attachments };
      if (buyer_email) row.buyer_email = buyer_email;
      if (buyer_name)  row.buyer_name  = buyer_name;
      if (seller_id)   row.seller_id   = seller_id;

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

    const listing_id  = normalizeInt(body.listing_id ?? body.listingId);
    if (!listing_id) return bad(res, 'Invalid listing_id');

    const buyer_email = coerceNull(body.buyer_email);
    const buyer_name  = coerceNull(body.buyer_name);
    const message     = coerceNull(body.message) ?? '';
    const topic       = coerceNull(body.topic) || 'business-inquiry';
    const is_deal_proposal = Boolean(body.is_deal_proposal);

    let seller_id     = coerceNull(body.seller_id);
    const seller_email = coerceNull(body.seller_email);
    if (!seller_id && seller_email) {
      seller_id = await resolveSellerId({ listing_id, seller_email });
    }

    const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
      .filter(a => a && typeof a === 'object')
      .map(a => ({
        path: a.path, name: a.name, size: a.size ?? null, mime: a.mime ?? null,
        kind: (a.kind === 'image' || a.kind === 'video')
          ? a.kind : (isImage(a.mime) ? 'image' : isVideo(a.mime) ? 'video' : 'other'),
      }))
      .filter(a => a.kind === 'image' || a.kind === 'video');

    const row = { listing_id, message, topic, is_deal_proposal: Boolean(is_deal_proposal), attachments };
    if (buyer_email) row.buyer_email = buyer_email;
    if (buyer_name)  row.buyer_name  = buyer_name;
    if (seller_id)   row.seller_id   = seller_id;
    // no sender_id column

    const out = await insertMessage(row);
    return ok(res, { message: out, uploaded: 0 });
  } catch (e) {
    err('ERROR:', e.message);
    return bad(res, `Failed to send message: ${e.message}`, 500);
  }
}

