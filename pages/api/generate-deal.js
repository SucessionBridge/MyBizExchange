// pages/api/generate-deal.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Auth: require a logged-in user ---
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) return res.status(401).json({ error: 'Unauthorized' });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { listing, buyer, allowSellerCarry } = req.body || {};
  if (!listing || !buyer) {
    return res.status(400).json({ error: "Missing listing or buyer data." });
  }

  // Helpers
  const n = (v) => {
    if (v === 0 || v) {
      const num = Number(v);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  };
  const money = (x) => (x == null ? "N/A" : `$${Number(x).toLocaleString()}`);

  // ---- Normalize key fields ----
  const businessName = listing.business_name || "Unknown";
  const ask = n(listing.asking_price) ?? 0;
  const industry = listing.industry || "N/A";
  const city =
    listing.city ||
    listing.location_city ||
    "N/A";

  const buyerName = buyer.name || "Buyer";
  const buyerExp = buyer.experience ?? "N/A";
  const buyerFinancingType = buyer.financing_type || buyer.preferred_financing || "N/A";
  const buyerCapital =
    n(buyer.capital_investment) ??
    n(buyer.available_capital) ??
    n(buyer.capital) ??
    0;
  const buyerBudget =
    n(buyer.budget_for_purchase) ??
    n(buyer.target_purchase_price) ??
    n(buyer.offer_price) ??
    null;

  // ---------------- Seller financing stance (robust) ----------------
  const clientOverride =
    typeof allowSellerCarry === "boolean" ? allowSellerCarry : null;

  const sfRaw = String(
    listing.seller_financing_considered ?? listing.sellerFinancingConsidered ?? ""
  ).toLowerCase().trim();

  const ftRaw = String(
    listing.financing_type ?? listing.financingType ?? ""
  ).toLowerCase();
  const ftNorm = ftRaw.replace(/\s+/g, "-");

  const hasTerms =
    n(listing.down_payment) > 0 ||
    n(listing.down_payment_pct) > 0 ||
    n(listing.term_length) > 0 ||
    n(listing.interest_rate) > 0 ||
    n(listing.seller_financing_interest_rate) > 0;

  const inferredCarry =
    ["yes", "maybe", "true", "1"].includes(sfRaw) ||
    /seller|owner|carry|note/.test(ftNorm) ||
    /rent/.test(ftNorm) ||
    hasTerms;

  const sellerCarryAllowed = clientOverride !== null ? clientOverride : inferredCarry;

  const fitLines = [
    `Asking Price: ${money(ask)}`,
    `Buyer Available Capital: ${money(buyerCapital)}`,
    `Buyer Budget/Target Price: ${money(buyerBudget)}`
  ].join("\n");

  const noCarryConstraints = sellerCarryAllowed
    ? ""
    : `
CONSTRAINTS (seller said NO to seller financing)
• Do NOT include any seller note, earnout, rent-to-own/lease-to-own, deferred payments to seller, or “payments credited toward down.”
• Each structure must pay the seller 100% of the price at close (e.g., bank/SBA/conventional loan + buyer equity and/or outside investor equity).
• You may vary loan types (SBA vs. conventional), LTV, and equity mixes, but seller receives full cash at close.`.trim();

  const headingRule = `Start each deal with a heading exactly: "Deal 1:", "Deal 2:", "Deal 3:" (on its own line).`;

  const prompt = `
You are an M&A deal maker. Draft exactly **3** acquisition deal structures that benefit both buyer and seller for the business below.

BUSINESS
• Name: ${businessName}
• Industry: ${industry}
• City: ${city}
• Asking Price: ${money(ask)}

BUYER
• Name: ${buyerName}
• Experience: ${buyerExp}/5
• Financing Type: ${buyerFinancingType}
• Available Capital: ${money(buyerCapital)}
• Budget/Target Price: ${money(buyerBudget)}

FIT
${fitLines}

${noCarryConstraints}

OUTPUT RULES
• ${headingRule}
• Keep each deal crisp (5–8 bullet lines).
• Use clear numbers where possible (down $, loan $, rough monthly payment if relevant).
• Include:
  - **Title**
  - **Down** (cash at close — % and $)
  - **Structure** (e.g., SBA/conventional loan amount, buyer/investor equity mix)
  - **Payments** (rough monthly, optional if conventional/SBA)
  - **Why it works for both** (1–2 short lines)
  - **Key protections** (e.g., bank covenants, DSCR expectations)
${sellerCarryAllowed
  ? "• If seller financing is acceptable, at least one deal can include a seller note or short bridge-to-bank."
  : "• Do not include any seller-carry structures."}
`.trim();

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
        temperature: 0.3,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", data);
      return res.status(500).json({ error: "AI generation failed." });
    }

    const aiSummary = data.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ summary: aiSummary });
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
