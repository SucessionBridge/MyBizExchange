// pages/api/send-message.js
import supabase from '../../lib/supabaseClient';

export const config = {
  api: {
    bodyParser: false, // ✅ Disable default parsing for file uploads
  },
};

import formidable from 'formidable';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form data' });

    const { message, seller_id, listing_id, buyer_name, buyer_email, topic, extension } = fields;
    let attachmentUrl = null;

    // ✅ Handle file upload if exists
    if (files.attachment) {
      const file = files.attachment;
      const fileExt = file.originalFilename.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const fileData = fs.readFileSync(file.filepath);

      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, fileData, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const { data: publicUrl } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      attachmentUrl = publicUrl.publicUrl;
    }

    // ✅ Insert message into DB
    const { error: insertError } = await supabase.from('messages').insert([
      {
        message,
        seller_id,
        listing_id,
        buyer_name,
        buyer_email,
        topic,
        extension,
        is_deal_proposal: false,
        attachment_url: attachmentUrl,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ success: true, attachmentUrl });
  });
}
