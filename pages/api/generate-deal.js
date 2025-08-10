// pages/api/generate-deal.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { listing, buyer } = req.body || {};

    if (!listing || !buyer) {
      return res.status(400).json({ error: "Missing listing or buyer data." });
    }

    // ----------------------------
    // Normalize inputs (be forgiving about field names)
    // ----------------------------
    const n = (v) => {
      if (v === 0 || v) {
        const num = Number(v);
        return Number.isFinite(num) ? num : null;
      }
      return null;
    };
    const money = (x) => (x == null ? "N/A" : `$${Number(x).toLocaleString()}`);

    const ask = n(
      listing.asking_price ??
        listing.askingPrice ??
        listing.price ??
        listing.list_price
    );

    const industry = listing.industry || "N/A";
    const location =
      listing.location ||
      [listing.location_city, listing.location_state, listing.city, listing.state]
        .filter(Boolean)
        .join(", ") ||
      "N/A";

    // Seller financing stance (optional but helpful)
    const sfConsidered =
      listing.seller_financing_considered ??
      listing.sellerFinancingConsidered ??
      (listing.financing_type === "seller-financed" ? "yes" : null);

    const downPct =
      n(listing.down_payment) ??
      n(listing.down_payment_pct) ??
      n(listing.down_payment_percent) ??
      null;
    const interestPct =
      n(listing.interest_rate) ??
      n(listing.seller_financing_interest_rate) ??
      10; // default fallback
    const termYears = n(listing.term_length) ?? n(listing.term_years) ?? 4; // standard amort default

    // Performance context (optional)
    const sde = n(listing.sde);
    const annualRevenue = n(listing.annual_revenue);
    const annualProfit = n(listing.annual_profit);
    const monthlyLease = n(listing.monthly_lease);
    const employees = n(listing.employees);
    const includesInventory = !!listing.includes_inventory;
    const includesBuilding = !!listing.includes_building;

    const title =
      listing.business_name && !listing.hide_business_name
        ? listing.business_name
        : listing.business_name
        ? "Confidential Business"
        : `${industry} Business`;

    // Buyer inputs
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

    // ----------------------------
    // Strategy math (gap + down-payment feasibility + bridge-to-bank + equity credit)
    // ----------------------------
    const NEAR_GAP_PCT = 10;
    const MOD_GAP_PCT = 25;
    const MIN_CASH_AT_CLOSE_PCT = 5; // always keep some real cash at close (bank-friendly)
    const DEFAULT_BRIDGE_MONTHS = 18;
    const MAX_EQUITY_CREDIT_PCT_OF_PRICE = 12; // cap "payments count toward down" credit
    const DEFAULT_NOTE_INTEREST = 10;
    const DEFAULT_AMORT_YEARS = 4;

    // Price gap
    let gapPct = null;
    let gapBucket = "unknown";
    if (ask && buyerBudget) {
      gapPct = Math.round(((ask - buyerBudget) / ask) * 100); // + = buyer under ask
      const abs = Math.abs(gapPct);
      if (abs <= NEAR_GAP_PCT) gapBucket = "near";
      else if (abs <= MOD_GAP_PCT) gapBucket = "moderate";
      else gapBucket = "far";
    }

    // Down payment feasibility
    const usedDownPct = downPct != null ? downPct : null;
    const requiredDown =
      ask && usedDownPct != null ? Math.round((usedDownPct / 100) * ask) : null;
    let downOk = null;
    let downShort = null;
    if (requiredDown != null) {
      downOk = buyerCapital >= requiredDown;
      downShort = downOk ? 0 : requiredDown - buyerCapital;
    }

    // Decide structure
    const useBridge =
      (downOk === false) || gapBucket === "moderate" || gapBucket === "far";

    // Bridge months heuristic
    let bridgeMonths = DEFAULT_BRIDGE_MONTHS;
    if (useBridge && ask && downShort != null) {
      const shortPct = (downShort / ask) * 100;
      if (shortPct >= 10 || gapBucket === "far") bridgeMonths = 24;
      else if (shortPct <= 5 && gapBucket === "near") bridgeMonths = 12;
    }

    // Minimum real cash at close
    const minCashAtClose =
      ask != null ? Math.round((MIN_CASH_AT_CLOSE_PCT / 100) * ask) : null;

    // Recommended cash down at close
    let recommendedCashDown = null;
    if (ask != null) {
      if (requiredDown != null) {
        recommendedCashDown = Math.min(buyerCapital, requiredDown);
      } else {
        // If no seller % given, use buyer capital (bounded) but keep minimum real cash
        recommendedCashDown = Math.min(buyerCapital, ask);
      }
      if (minCashAtClose != null) {
        recommendedCashDown = Math.max(recommendedCashDown ?? 0, minCashAtClose);
      }
      recommendedCashDown = Math.min(recommendedCashDown ?? 0, ask);
    }

    const recommendedDownPct =
      ask && recommendedCashDown != null
        ? Math.round((recommendedCashDown / ask) * 100)
        : usedDownPct;

    // Note principal (simplified)
    const notePrincipal =
      ask && recommendedCashDown != null ? ask - recommendedCashDown : ask ?? null;

    const usedInterest = interestPct ?? DEFAULT_NOTE_INTEREST;
    const usedTermYears = useBridge ? null : (termYears ?? DEFAULT_AMORT_YEARS);

    // Equity credit (payments count toward down) — only if shortfall is modest
    let equityCreditMonthly = 0;
    let equityCreditCap = 0;
    if (useBridge && ask && requiredDown != null && recommendedCashDown != null) {
      const shortNow = Math.max(0, requiredDown - recommendedCashDown);
      const shortPctOfPrice = (shortNow / ask) * 100;
      if (shortNow > 0 && shortPctOfPrice <= MAX_EQUITY_CREDIT_PCT_OF_PRICE) {
        equityCreditCap = shortNow; // cap to remaining shortfall
        equityCreditMonthly = Math.ceil(equityCreditCap / bridgeMonths);
      }
    }

    // Suggestions (to steer model tone)
    const suggestions = [];
    if (gapBucket === "near") {
      suggestions.push("Position as a fair offer and lean on speed/certainty of close.");
    } else if (gapBucket === "moderate") {
      suggestions.push("Propose a midpoint or sweetener (slightly higher down or small earnout).");
    } else if (gapBucket === "far") {
      suggestions.push("Frame as value-seeking: structure (earnout or rent-to-own) to bridge price expectations.");
    }
    if (downOk === false) {
      suggestions.push(
        `Buyer capital is short of the required down by ~${money(downShort)}. Suggest a bridge-to-bank with a capped equity credit, or mix bank term debt.`
      );
    }
    suggestions.push(
      "Include simple covenants: monthly P&L, DSCR target, refinance window, and fallback if refi fails."
    );

    // ----------------------------
    // Prompt with strategy-aware guidance (3 deals)
    // ----------------------------
    const strategyHeader =
      useBridge
        ? `Bridge-to-Bank context: interest-only ${bridgeMonths} months, then balloon/refi.`
        : `Standard amortizing context: term ~${usedTermYears || 4} years.`;

    const equityCreditLine =
      useBridge && equityCreditMonthly && equityCreditCap
        ? `Down-Payment Credit: During the bridge period, ${money(
            equityCreditMonthly
          )} from each monthly payment accrues as Buyer Equity Credit, up to ${money(
            equityCreditCap
          )}. Credit reduces the balloon at refinance (or is applied to principal if converted to amortizing). Credit accrues only while current; 2+ late payments stop accrual.`
        : null;

    const fitLines = [
      ask != null && buyerBudget != null
        ? `Buyer offer vs ask: ~${gapPct}% ${gapPct >= 0 ? "under" : "over"} ask (${money(
            buyerBudget
          )} vs ${money(ask)}).`
        : `Buyer offer not specified.`,
      requiredDown != null
        ? `Required down (seller %): ${money(requiredDown)}. Buyer capital: ${money(
            buyerCapital
          )}${downOk === false ? ` (short by ~${money(downShort)})` : ""}.`
        : `Seller down % not specified; using buyer capital and minimum cash at close.`,
      `Recommended cash down at close: ${
        recommendedDownPct != null ? recommendedDownPct + "%" : "TBD"
      } (~${money(recommendedCashDown)}).`,
      `Estimated seller note: ~${money(notePrincipal)} at ${usedInterest}% ${
        useBridge
          ? `(interest-only ${bridgeMonths} months, then balloon/refi)`
          : `(amortizing ~${usedTermYears || 4} years)`
      }.`,
    ].join("\n");

    const includesLine = `${includesInventory ? "Inventory included" : "Inventory not included"}${
      includesBuilding ? " + Building included" : ""
    }`.trim();

    const prompt = `
You are an M&A deal maker. Draft exactly **3** creative acquisition deal structures that benefit both buyer and seller. Use the strategy and numbers below. Keep each deal crisp (5–8 bullet lines max) and seller-friendly in tone.

LISTING
• Title: ${title}
• Industry: ${industry}
• Location: ${location}
• Asking Price: ${money(ask)}
• SDE: ${money(sde)} | Revenue: ${money(annualRevenue)} | Profit: ${money(annualProfit)}
• Lease: ${money(monthlyLease)}/mo | Employees: ${employees ?? "N/A"}
• ${includesLine}
• Seller financing stance: ${sfConsidered ?? "unspecified"}

BUYER
• Name: ${buyerName}
• Experience: ${buyerExp}/5
• Financing Type: ${buyerFinancingType}
• Available Capital: ${money(buyerCapital)}
• Budget/Target Price: ${money(buyerBudget)}

FIT & STRATEGY
${fitLines}
• Gap bucket: ${gapBucket.toUpperCase()}
• ${strategyHeader}
${equityCreditLine ? `• ${equityCreditLine}` : ""}
• Guidance:
${suggestions.map((s) => `  - ${s}`).join("\n")}

OUTPUT FORMAT (return exactly 3 deals):
For each deal, provide:
- **Title**
- **Down** (cash at close, % and $)
- **Structure** (seller note size, interest, schedule; if bridge, note interest-only months and balloon month)
- **Payments** (est. monthly during the period)
${equityCreditLine ? `- **Down-Payment Credit** (state ${money(equityCreditMonthly)}/mo up to ${money(equityCreditCap)})` : "- **Down-Payment Credit** (if applicable)"}
- **Why it works for both** (1–2 short lines)
- **Key protections** (seller friendly: lien/PG, monthly P&L/DSCR, refinance window + fallback)

Deal 1 should align with the recommended structure above (${
      useBridge ? "BRIDGE-TO-BANK" : "STANDARD AMORTIZING"
    }).
Deal 2 should be the main alternative (if Deal 1 is bridge, make this a standard amortizing note; if Deal 1 is standard, make this a bridge-to-bank).
Deal 3 can be an earnout or rent-to-own variant to bridge expectations when needed.

Keep total response under ~550 tokens and avoid fluff. Use real numbers from above wherever possible.
    `.trim();

    // ----------------------------
    // Call OpenAI (keep your existing pattern)
    // ----------------------------
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
    // Keep the same response shape to avoid breaking callers
    return res.status(200).json({ summary: aiSummary });
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
