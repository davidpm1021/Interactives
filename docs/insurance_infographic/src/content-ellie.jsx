/* content-ellie.jsx — Ellie's independent copy. All globals suffixed -E so
   they don't collide with content-v2.jsx in the shared Babel scope. */

const IG_CONTENT_E = {
  title: ["Premiums, Deductibles", "& Limits"],
  intro: "Premiums, deductibles, and limits all shape what insurance costs you \u2014 and how much coverage you actually get. Here\u2019s what each one means.",
  terms: [
  {
    key: "premium",
    n: "01",
    term: "Premium",
    gloss: "What you pay to have insurance",
    body: "A premium is the amount you pay for your insurance policy \u2014 usually every month, every six months, or once a year. Paying your premium on time keeps your policy active."
  },
  {
    key: "deductible",
    n: "02",
    term: "Deductible",
    gloss: "What you pay before coverage kicks in",
    body: "If you file a claim for a covered loss, the deductible is the amount you pay out of pocket first. Your insurance starts paying only after you\u2019ve met it."
  },
  {
    key: "limit",
    n: "03",
    term: "Coverage Limit",
    gloss: "The most your policy will pay",
    body: "A coverage limit is the maximum amount your policy will pay for a covered loss. Many policies bundle several types of coverage, each with its own limit."
  }],


  // Relationship 1 — deductible & premium move in OPPOSITE directions.
  tradeoffLede: "Your deductible and your premium work like a see-saw: when one goes up, the other usually comes down.",
  tradeoff: [
  { scenario: "Choose a HIGHER deductible", aDir: "up", aAmt: "$$$", bDir: "down", bAmt: "$", takeaway: "Pay less each month, but more out of pocket if you file a claim." },
  { scenario: "Choose a LOWER deductible", aDir: "down", aAmt: "$", bDir: "up", bAmt: "$$$", takeaway: "Pay more each month, but less out of pocket if you file a claim." }],


  // Relationship 2 — limit & premium move in the SAME direction.
  limitLede: "Your coverage limit and your premium climb together: the more your policy could pay out, the more it costs to insure.",
  limit: [
  { scenario: "Choose a HIGHER limit", aDir: "up", aAmt: "$$$", bDir: "up", bAmt: "$$$", takeaway: "More protection if you file a claim for a higher cost each month." },
  { scenario: "Choose a LOWER limit", aDir: "down", aAmt: "$", bDir: "down", bAmt: "$", takeaway: "A lower cost each month, but less protection if you file a claim." }]

};

// Coverage bar — Deductible (you pay) | Insurance coverage | Limit cap.
function CoverageBarE({ tone = "light", beyondColor = "var(--ngpf-pale-blue-3)" }) {
  const legendColor = tone === "dark" ? "rgba(255,255,255,0.92)" : "var(--fg-2)";
  return (
    <div className="cov" style={{ "--cov-limit-x": "calc(78% + 3px)" }}>
      <div className="cov-limit-flag">
        <div className="cov-limit-label">Coverage limit</div>
        <div className="cov-limit-tick"></div>
      </div>
      <div className="cov-row">
        <div className="cov-seg cov-deductible">
          <span className="cov-seg-t">Deductible</span>
        </div>
        <div className="cov-seg cov-coverage">
          <span className="cov-seg-t">Insurance Coverage</span>
        </div>
        <div className="cov-seg cov-beyond" style={{ background: beyondColor }}>
          <span className="cov-beyond-t">Above limit</span>
        </div>
      </div>
      <div className="cov-brackets">
        <div className="cov-bracket-cell cell-ded">
          <div className="cov-bracket"></div>
          <p className="cov-def">What <b>you</b> pay first</p>
        </div>
        <div className="cov-bracket-cell cell-cov">
          <div className="cov-bracket"></div>
          <p className="cov-def">What your <b>insurer</b> pays, up to your limit</p>
        </div>
        <div className="cov-bracket-cell cell-beyond">
          <div className="cov-bracket"></div>
          <p className="cov-def">You cover the remaining costs <b>above</b> the limit</p>
        </div>
      </div>
    </div>);

}

function TradeArrowE({ dir, kind }) {
  const kindCls = kind === "ded" ? "arrow-ded" : kind === "lim" ? "arrow-lim" : "arrow-prem";
  const cls = "arrow " + (dir === "up" ? "arrow-up" : "arrow-down") + " " + kindCls;
  return <div className={cls}></div>;
}

// Generic two-factor relationship: two scenario cards, each with two arrows.
function RelationPairE({ items, aKind, aLabel, bKind, bLabel, cardStyle = {}, textColor }) {
  return (
    <div className="trade">
      {items.map((s, i) =>
      <div className="trade-card" key={i} style={{ ...cardStyle, color: textColor }}>
          <p className="trade-scenario" style={{ color: textColor }}>{s.scenario}</p>
          <div className="trade-arrows">
            <div className="trade-col">
              <TradeArrowE dir={s.aDir} kind={aKind} />
              <span className={"arrow-lbl amt-" + aKind}>{aLabel}</span>
              <span className={"arrow-amt amt-" + aKind}>{s.aAmt}</span>
            </div>
            <div className="trade-col">
              <TradeArrowE dir={s.bDir} kind={bKind} />
              <span className={"arrow-lbl amt-" + bKind}>{bLabel}</span>
              <span className={"arrow-amt amt-" + bKind}>{s.bAmt}</span>
            </div>
          </div>
          <p className="trade-takeaway" style={{ color: textColor }}>{s.takeaway}</p>
        </div>
      )}
    </div>);

}

function TradeoffE(props) {
  return <RelationPairE items={IG_CONTENT_E.tradeoff} aKind="ded" aLabel="Deductible" bKind="prem" bLabel="Premium" {...props} />;
}
function LimitPremiumE(props) {
  return <RelationPairE items={IG_CONTENT_E.limit} aKind="lim" aLabel="Limit" bKind="prem" bLabel="Premium" {...props} />;
}

Object.assign(window, { IG_CONTENT_E, CoverageBarE, TradeoffE, LimitPremiumE, RelationPairE, TradeArrowE });
