// pages/api/send-message.js
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // allow formidable to handle multipart
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // optional fallback
const BUCKET = 'message-attachments';

// Prefer service-role (can bypass RLS for Storage inserts if policies block anon)
const supabase =
  SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY)
    : createClient(SUPABASE_URL, ANON_KEY); // fallback (uploads may fail if policy requires auth)

function ok(res, payload) {
  res.status(200).json({ ok: true, ...payload });
}
function bad(res, msg, code = 400) {
  res.status(code).json({ ok: false, error: msg });
}

function isImage(m) { return typeof m === 'string' && m.startsWith('image/'); }
function isVideo(m) { return typeof m === 'string' && m.startsWith('video/'); }

function toSafeName(name = '') {
  return String(name).replace(/[^\w.\-]+/g, '_').slice(-180) || `file_${Date.now()}`;
}

/** Upload one formidable file to Storage, return attachment object */
async function uploadOne({ file, listingId, actorEmail, actorRole }) {
  // robust guards against missing mime/original name
  const mime = file.mimetype || file.mime || '';
  const ext = (file.originalFilename || '').split('.').pop() || '';
  const kind = isImage(mime) ? 'image' : (isVideo(mime) ? 'video' : 'other');

  if (kind === 'other') return null; // skip non-image/video quietly

  const baseName = toSafeName(file.originalFilename || `upload.${ext || 'bin'}`);
  const dir =
    actorRole === 'seller'
      ? `listing-${listingId}/seller-${actorEmail}`
      : `listing-${listingId}/buyer-${actorEmail}`;
  const path = `${dir}/${Date.now()}-${baseName}`;

  // Read as stream and upload
  const stream = fs.createReadStream(file.filepath);
  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, stream, { contentType: mime || undefined, upsert: false });

  if (error) {
    console.warn('Storage upload failed:', error.message);
    return null;
  }

  return {
    path,
    name: file.originalFilename || baseName,
    size: file.size || null,
    mime: mime || null,
    kind,
  };
}

// Parse multipart with formidable
async function parseMultipart(req) {
  const form = formidable({ multiples: true, keepExtensions: true });
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
  });
  return { fields, files };
}

// Normalized insert into messages
async function insertMessage({
  listing_id,
  buyer_email,
  seller_email,
  buyer_name,
  seller_name,
  message,
  topic = 'business-inquiry',
  is_deal_proposal = false,
  attachments = [],
}) {
  const { error, data } = await supabase
    .from('messages')
    .insert([{
      listing_id,
      buyer_email: buyer_email || null,
      buyer_name: buyer_name || null,
      seller_email: seller_email || null,
      seller_name: seller_name || null,
      message: message || '',
      topic,
      is_deal_proposal: Boolean(is_deal_proposal),
      attachments, // JSONB
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const contentType = req.headers['content-type'] || '';
    let payload = {};
    let files = {};

    if (contentType.includes('multipart/form-data')) {
      // Legacy callers (forms)
      const { fields, files: f } = await parseMultipart(req);

      // pull common fields defensively
      const listing_id = fields.listing_id?.toString() || fields.listingId?.toString();
      const buyer_email = fields.buyer_email?.toString() || '';
      const seller_email = fields.seller_email?.toString() || '';
      const buyer_name = fields.buyer_name?.toString() || '';
      const seller_name = fields.seller_name?.toString() || '';
      const message = fields.message?.toString() || '';
      const topic = (fields.topic?.toString() || 'business-inquiry');
      const is_deal_proposal = ['true', '1', 'yes'].includes(
        (fields.is_deal_proposal || '').toString().toLowerCase()
      );

      if (!listing_id) return bad(res, 'Missing listing_id');

      // Decide actor role for storage path
      const actorRole = fields.actor_role?.toString() ||
        (buyer_email && !seller_email ? 'buyer' : 'seller');
      const actorEmail = actorRole === 'seller' ? seller_email : buyer_email;

      // normalize "attachments" input from formidable
      const raw = f.attachments || f.attachment || f.file || null;
      const uploads = Array.isArray(raw) ? raw : raw ? [raw] : [];

      const attachments = [];
      if (uploads.length) {
        if (!SERVICE_KEY) {
          console.warn('No SERVICE ROLE key available; skipping file uploads. Message will be text-only.');
        } else {
          for (const file of uploads) {
            const att = await uploadOne({
              file,
              listingId: listing_id,
              actorEmail,
              actorRole,
            });
            if (att) attachments.push(att);
          }
        }
      }

      const row = await insertMessage({
        listing_id,
        buyer_email,
        seller_email,
        buyer_name,
        seller_name,
        message,
        topic,
        is_deal_proposal,
        attachments,
      });

      return ok(res, { message: row, uploaded: attachments.length });

    } else {
      // JSON callers
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', () => {
          try { resolve(JSON.parse(data || '{}')); }
          catch (e) { reject(e); }
        });
        req.on('error', reject);
      });

      const {
        listing_id, listingId,
        buyer_email, seller_email,
        buyer_name, seller_name,
        message, topic, is_deal_proposal,
        attachments = [],   // already-uploaded objects allowed
      } = body || {};

      const lid = listing_id || listingId;
      if (!lid) return bad(res, 'Missing listing_id');

      // Only accept image/video kinds in JSON attachments
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
        buyer_email, seller_email,
        buyer_name, seller_name,
        message,
        topic,
        is_deal_proposal,
        attachments: safeAtt,
      });

      return ok(res, { message: row, uploaded: 0 });
    }
  } catch (err) {
    console.error('send-message error:', err);
    return bad(res, 'Failed to send message', 500);
  }
}


