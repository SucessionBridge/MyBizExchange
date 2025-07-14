import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: true });

  try {
    const [fields, files] = await form.parse(req);

    console.log('✅ Parsed fields:', fields);
    console.log('✅ Parsed files:', files);

    const imageUrls = [];
    const fileField = files['images[]'];
    const fileArray = Array.isArray(fileField) ? fileField : fileField ? [fileField] : [];

    for (const file of fileArray) {
      if (!file || !file.filepath) continue;

      const buffer = fs.readFileSync(file.filepath);
      const filename = `${Date.now()}-${file.originalFilename}`;
      const { error: uploadErr } = await supabase.storage
        .from('seller-images')
        .upload(filename, buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadErr) {
        console.error('❌ Image upload error:', uploadErr);
      } else {
        const { data: urlData } = supabase.storage.from('seller-images').getPublicUrl(filename);
        imageUrls.push(urlData.publicURL);
      }
    }

    // ✅ Step 1: Skip DB insert and return image upload result
    return res.status(200).json({
      success: true,
      message: 'Image upload test complete',
      imageUrls,
    });

  } catch (e) {
    console.error('❌ Unexpected error:', e.message, e.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}
