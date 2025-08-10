// pages/api/generate-deal.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listing, buyer } = req.body || {};
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

  // Seller financing stance
  const sfRaw =
    (listing.seller_financing_considered ||
      listing.sellerFinancingConsidered ||
      "").toString().toLowerCase();

  // Allow seller-carry only if explicitly yes/maybe OR financing_type says seller-financed
  const sellerCarryAllowed =
    sfRaw === "yes" ||
    sfRaw === "maybe" ||
    (String(listing.financing_type || "").toLowerCase() === "seller-financed");

  // Simple context lines the model can use
  const fitLines = [
    `Asking Price: ${money(ask)}`,
    `Buyer Available Capital: ${money(buyerCapital)}`,
    `Buyer Budget/Target Price: ${money(buyerBudget)}`
  ].join("\n");

  // Constraint block when seller said NO
  const noCarryConstraints = sellerCarryAllowed
    ? ""
    : `
CONSTRAINTS (seller said NO to seller financing)
• Do NOT include any seller note, earnout, rent-to-own/lease-to-own, deferred payments to seller, or “payments credited toward down.”
• Each structure must pay the seller 100% of the price at close (e.g., bank/SBA/conventional loan + buyer equity and/or outside investor equity).
• You may vary loan types (SBA vs. conventional), LTV, and equity mixes, but seller receives full cash at close.`;

  // Require strict headings so the frontend splitter never misses Deal 1
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
${sellerCarryAllowed ? "• If seller financing is acceptable, at least one deal can include a seller note or short bridge-to-bank. Otherwise, do not include any seller-carry." : "• Do not include any seller-carry structures."}
`.trim();

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
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
