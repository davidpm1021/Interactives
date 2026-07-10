/* layout-c.jsx — "Bold alternating color blocks" */
function InfographicCEllie({ tweaks = {} }) {
  const C = window.IG_CONTENT_E;
  const panels = ["c-term-panel--primary", "c-term-panel--bright", "c-term-panel--sky"];
  const badges = ["badge--primary", "badge--bright", "badge--sky"];
  const termIcons = ["la-file-invoice-dollar", "la-wallet", "la-shield-alt"];

  const heroClass = tweaks.heroColor === "true" ? "ngpf-bg-pattern-primary" : "ngpf-bg-pattern-bright";
  const umbAlign = tweaks.umbrellaAlign === "top" ? "flex-start" : "center";
  const umbSize = tweaks.umbrellaSize || 170;
  const accent = tweaks.deductibleAccent === "orange" ? "var(--ngpf-orange)" : "var(--ngpf-gold)";
  const showTagline = tweaks.showTagline !== false;
  const beyondColor = tweaks.beyondLimitColor || "var(--ngpf-pale-blue-3)";
  const rootStyle = { "--cov-deductible-bg": accent };

  return (
    <div className="ig ig-c ig-ellie" style={rootStyle}>
      {/* HERO */}
      <header className={"c-hero " + heroClass} style={{ backgroundImage: "url('assets/hero-insurance.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <img className="c-hero-logo" src="assets/ngpf-horizontal-primary-ko.svg" alt="NGPF" />
        <div className="c-hero-copy">
          <h1 className="ig-title c-hero-title">Premiums, Deductibles,<br />and Limits</h1>
          <p className="ig-body c-hero-intro">Premiums, deductibles, and limits all shape what insurance costs you — and how much coverage you actually get.</p>
        </div>
      </header>

      {/* TERMS — all three together in one chunk */}
      <section className="c-terms-chunk">
        {C.terms.map((t, i) =>
        <div className="c-term-item" key={t.key}>
            <span className={"c-term-badge " + badges[i]}><i className={"las " + termIcons[i]}></i></span>
            <div className="c-term-itext">
              <h3 className="c-term-name2">{t.term}</h3>
              <p className="c-term-gloss">{t.gloss}</p>
              <p className="ig-body c-term-body">{t.body}</p>
            </div>
          </div>
        )}
      </section>

      {/* COVERAGE BAR — dark block */}
      <section className="ngpf-bg-pattern-primary c-cov">
        <h2 className="ig-h c-cov-h">How a claim gets paid</h2>
        <p className="ig-body c-cov-intro">You cover the deductible first. Your insurer pays the rest — up to your coverage limit.</p>
        <CoverageBarE tone="dark" beyondColor={beyondColor} />
      </section>

      {/* WHAT CHANGES YOUR PREMIUM — two paired relationships */}
      <section className="c-trade">
        <h2 className="ig-h c-trade-h">What changes your premium?</h2>
        <p className="ig-body c-trade-lede">Two of your choices pull on your premium, but in opposite ways.</p>

        <div className="rel-group">
          <div className="rel-subh">
            <span className="rel-subh-term" style={{ color: "var(--ngpf-primary-blue)" }}>{"DEDUCTIBLE"}</span>
          </div>
          <p className="ig-body c-trade-lede">{C.tradeoffLede}</p>
          <TradeoffE cardStyle={{ background: "var(--ngpf-pale-blue)" }} textColor="var(--ngpf-dark-blue)" />
        </div>

        <div className="rel-group c-rel-divider">
          <div className="rel-subh">
            <span className="rel-subh-term" style={{ color: "var(--ngpf-primary-blue)" }}>{"COVERAGE LIMIT"}</span>
          </div>
          <p className="ig-body c-trade-lede">{C.limitLede}</p>
          <LimitPremiumE cardStyle={{ background: "var(--ngpf-pale-blue)" }} textColor="var(--ngpf-dark-blue)" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="c-foot">
        <div className="c-foot-main">
          <img className="c-foot-logo" src="assets/ngpf-horizontal-primary.png" alt="NGPF" />
          <div className="c-foot-sources">
            <span className="c-foot-sources-label">Sources</span>
            <a href="https://www.allstate.com/resources/Allstate/images/tools-resources-articles/insurance-basics/premium-limits-deductibles-infographic-desktop.jpg?v=40eb2a5e-d4e5-12f0-d905-e3b2f172119f" target="_blank" rel="noopener">Allstate</a>
            <span className="c-foot-sep">|</span>
            <a href="https://www.njm.com/ask/what-is-an-insurance-premium" target="_blank" rel="noopener">NJM</a>
          </div>
        </div>
      </footer>
    </div>);

}
window.InfographicCEllie = InfographicCEllie;