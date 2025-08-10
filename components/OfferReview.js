// components/OfferReview.js
import { useMemo, useState } from "react";

export default function OfferReview({ proposalText, ctx, strategy, onBack, onConfirm, sending = false }) {
  const s = ctx?.seller || {};
  const b = ctx?.buyer || {};
  const r = strategy?.recommended || {};
  const isBridge = strategy?.structure === "bridgeBalloon";

  // math helpers
  const money = (n) => (n == null ? "N/A" : `$${Number(n).toLocaleString()}`);
  const pct = (n) => (n == null ? "N/A" : `${Number(n)}%`);
  const pmt = (principal, annualRatePct, months) => {
    if (!principal || !annualRatePct || !months) return null;
    const r = Number(annualRatePct) / 100 / 12;
    if (r === 0) return Math.round(principal / months);
    const m = (principal * r) / (1 - Math.pow(1 + r, -months));
    return Math.round(m);
  };

  const interestOnlyMonthly = useMemo(() => {
    if (!r.notePrincipal || !r.interestPct) return null;
    const rate = Number(r.interestPct) / 100 / 12;
    return Math.round(r.notePrincipal * rate);
  }, [r.notePrincipal, r.interestPct]);

  const amortMonthly = useMemo(() => {
    if (isBridge) return null;
    const months = (s?.sellerFinancing?.termYears ?? r.termYears ?? 4) * 12;
    return pmt(r.notePrincipal, r.interestPct, months);
  }, [isBridge, r.notePrincipal, r.interestPct, r.termYears, s?.sellerFinancing?.termYears]);

  // acknowledgements
  const [ack1, setAck1] = useState(false); // cash down
  const [ack2, setAck2] = useState(false); // equity credit reality
  const [ack3, setAck3] = useState(false); // balloon/refi fallback
  const [ack4, setAck4] = useState(false); // confirm content matches

  const needEquityAck = (r?.equityCreditMonthly || 0) > 0;
  const needBridgeAck = isBridge;

  const canSend =
    ack1 &&
    (!needEquityAck || ack2) &&
    (!needBridgeAck || ack3) &&
    ack4 &&
    !sending;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: What the seller will see */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-3">What the seller will see</h3>
        <div className="prose max-w-none whitespace-pre-wrap text-[15px] leading-6">
          {proposalText || "No draft available."}
        </div>
      </div>

      {/* Right: Plain-language recap for the buyer */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-3">Key terms (for your review)</h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Term label="Asking price" value={money(s.askingPrice)} />
          <Term label="Your target price" value={money(b.targetPurchasePrice)} />
          <Term label="Cash down at close" value={`${pct(r.cashDownPct)} (~${money(r.cashDownAtClose)})`} />
          <Term label="Seller note (est.)" value={money(r.notePrincipal)} />
          <Term label="Interest rate" value={pct(r.interestPct)} />
          {isBridge ? (
            <>
              <Term label="Structure" value={`Bridge-to-bank`} />
              <Term label="Interest-only period" value={`${r.bridgeMonths} months`} />
              <Term label="Balloon target" value={`Month ${r.balloonAtMonth}`} />
              <Term
                label="Est. monthly (bridge)"
                value={interestOnlyMonthly ? money(interestOnlyMonthly) : "N/A"}
              />
              {r.equityCreditMonthly > 0 && (
                <>
                  <Term label="Equity credit / mo" value={money(r.equityCreditMonthly)} />
                  <Term label="Equity credit cap" value={money(r.equityCreditCap)} />
                </>
              )}
            </>
          ) : (
            <>
              <Term label="Structure" value={`Standard amortizing`} />
              <Term
                label="Amortization"
                value={`${s?.sellerFinancing?.termYears ?? r.termYears ?? 4} years`}
              />
              <Term
                label="Est. monthly (amort.)"
                value={amortMonthly ? money(amortMonthly) : "N/A"}
              />
            </>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Ack checked={ack1} onChange={setAck1}>
            I confirm the **cash down at close** shown above is what I intend to offer.
          </Ack>
          {needEquityAck && (
            <Ack checked={ack2} onChange={setAck2}>
              I understand **“Down-Payment Credit”** (payments credited toward down) usually **does not count**
              as bank equity; it reduces the **balloon** or principal later.
            </Ack>
          )}
          {needBridgeAck && (
            <Ack checked={ack3} onChange={setAck3}>
              I understand the **balloon/refinance timeline** and the **fallback** if bank refinance isn’t available.
            </Ack>
          )}
          <Ack checked={ack4} onChange={setAck4}>
            I’ve reviewed the summary and numbers and I’m comfortable sending this to the seller.
          </Ack>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${canSend ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            {sending ? "Sending…" : "Send to Seller"}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Tip: If anything looks off, go back and adjust your numbers before sending. Clear, consistent
          terms = faster replies.
        </p>
      </div>
    </div>
  );
}

function Term({ label, value }) {
  return (
    <div className="border rounded-lg px-3 py-2 bg-gray-50">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Ack({ children, checked, onChange }) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="select-none">{children}</span>
    </label>
  );
}
