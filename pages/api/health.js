// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasBucket: !!process.env.SUPABASE_STORAGE_BUCKET,
  });
}
