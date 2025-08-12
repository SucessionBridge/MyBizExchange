// pages/api/send-report.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, filename = 'valuation-report.pdf', pdfBase64 } = req.body || {};
    if (!email || !pdfBase64) return res.status(400).json({ error: 'Missing email or pdfBase64' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const buffer = Buffer.from(pdfBase64, 'base64');
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_') || 'valuation-report.pdf';
    const path = `reports/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;

    const { error: uploadErr } = await supabase
      .storage
      .from('valuation-reports')
      .upload(path, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadErr) return res.status(500).json({ error: uploadErr.message });

    const { data: publicData } = supabase
      .storage
      .from('valuation-reports')
      .getPublicUrl(path);

    const url = publicData?.publicUrl;
    if (!url) return res.status(500).json({ error: 'Failed to get public URL' });

    return res.status(200).json({ url });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
