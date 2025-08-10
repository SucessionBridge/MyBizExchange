// /lib/buildDealPrompt.js

export function buildDealPrompt(ctx, strategy) {
  const s = ctx.seller, b = ctx.buyer;
  const r = strategy.recommended;

  const sf = s.sellerFinancing || {};
  const sfLine = sf.considered && sf.considered !== 'no'
    ? `Seller is open to financing (${sf.considered}).`
    : `Seller financing preference: ${s.financingPreference || 'unspecified'}.`;

  const gapLine = strategy.gapPct != null
    ? `Buyer offer vs ask: ~${strategy.gapPct}% ${strategy.gapPct >= 0 ? 'under' : 'over'} ask (${money(strategy.offer)} vs ${money(strategy.ask)}).`
    : `Buyer offer price not specified.`;

  const capLine = strategy.requiredDown != null
    ? `Required down: ${money(strategy.requiredDown)}. Buyer capital: ${money(strategy.buyerCapital)}${strategy.downOk===false?` (short by ~${money(strategy.downShort)})`:''}.`
    : `Seller down % not specified.`

  const structureHeader =
    strategy.structure === 'bridgeBalloon'
      ? `Bridge-to-Bank Proposal (interest-only ${strategy.recommended.bridgeMonths} months, then balloon/refi)`
      : `Standard Amortizing Seller Note`;

  const equityCreditClause = (r.equityCreditMonthly && r.equityCreditCap)
    ? [
        `Down-Payment Credit: During the bridge period, ${money(r.equityCreditMonthly)} from each monthly payment accrues as Buyer Equity Credit, up to ${money(r.equityCreditCap)}.`,
        `The accrued credit reduces the balloon at refinance (or is applied to principal if the note converts to amortizing).`,
        `Credit accrues only while the account is current; two or more late payments (>15 days) stop further accrual.`
      ].join(' ')
    : null;

  const fallbackClause = (strategy.structure === 'bridgeBalloon')
    ? `If refinance isn’t achieved by month ${strategy.recommended.balloonAtMonth}, note auto-extends 12 months at a step-up rate or converts to a ${Math.max(36, (s.sellerFinancing?.termYears || 48))}-month amortization at the prevailing rate (buyer’s option).`
    : null;

  return [
    `You are an M&A deal maker drafting a concise, **seller-friendly** offer summary that also respects buyer constraints.`,
    ``,
    `LISTING`,
    `Title: ${s.title}`,
    `Industry: ${s.industry ?? 'N/A'}`,
    `Location: ${s.location ?? 'N/A'}`,
    `Asking Price: ${money(s.askingPrice)}`,
    `SDE: ${money(s.sde)} | Revenue: ${money(s.annualRevenue)} | Profit: ${money(s.annualProfit)}`,
    `Lease: ${money(s.monthlyLease)} / mo`,
    `Includes: ${s.includesInventory ? 'Inventory' : '—'} ${s.includesBuilding ? '+ Building' : ''}`.trim(),
    `Employees: ${s.employees ?? 'N/A'}`,
    sfLine,
    ``,
    `BUYER`,
    `Available Capital: ${money(b.availableCapital)}`,
    `Target Purchase Price: ${money(b.targetPurchasePrice)}`,
    ``,
    `FIT CHECK`,
    gapLine,
    capLine,
    `Strategy: ${strategy.structure.toUpperCase()} | Gap bucket: ${strategy.gapBucket.toUpperCase()}`,
    ...(strategy.suggestions || []).map(s => `- ${s}`),
    ``,
    `PROPOSED TERMS — ${structureHeader}`,
    `• Cash down at close: ${r.cashDownPct != null ? r.cashDownPct + '%' : 'TBD'} (~${money(r.cashDownAtClose)})`,
    `• Seller note: ~${money(r.notePrincipal)} at ${r.interestPct ?? 'TBD'}%`,
    ...(strategy.structure === 'bridgeBalloon'
      ? [
          `• Payments: interest-only for ${r.bridgeMonths} months, balloon at month ${r.balloonAtMonth} via bank refinance`,
        ]
      : [
          `• Payments: amortizing over ${s.sellerFinancing?.termYears ?? 48/12} years`,
        ]),
    ...(equityCreditClause ? [`• ${equityCreditClause}`] : []),
    ...(fallbackClause ? [`• ${fallbackClause}`] : []),
    `• Security: standard lien/UCC and personal guarantee`,
    `• Reporting: monthly P&L and DSCR target to support refinance readiness`,
    ``,
    `DESCRIPTION`,
    s.description || 'No description provided.',
    ``,
    `TASK`,
    `Draft a short, confident, seller-friendly offer summary following the "PROPOSED TERMS".`,
    `Keep it to ~150–220 words. Offer one optional variant (e.g., small earnout or slightly different down %).`,
  ].join('\n');
}

function money(n){ if (n==null) return 'N/A'; return `$${Number(n).toLocaleString()}`; }
