// pages/api/contact-submit.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Basic allowlist of fields we accept
const FIELDS = ["name", "email", "phone", "subject", "message"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase env vars are missing." });
    }

    const body = req.body || {};
    // Honeypot: treat any non-empty "website" as spam
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return res.status(200).json({ ok: true });
    }

    const payload = {};
    for (const key of FIELDS) {
      const v = typeof body[key] === "string" ? body[key].trim() : "";
      payload[key] = v;
    }

    if (!payload.name || !payload.email || !payload.message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          subject: payload.subject || null,
          message: payload.message,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save your message." });
    }

    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (err) {
    console.error("contact-submit error:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
}
