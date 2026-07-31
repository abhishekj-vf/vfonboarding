import { BrandMark } from "./brand-mark";

export function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="About the creator community">
      <header className="brand-header">
        <BrandMark />
        <span className="brand-chip">Creator club · India</span>
      </header>

      <div className="brand-copy">
        <p className="kicker">Made for campus creators</p>
        <h1>
          Your reach
          <em>deserves a stage.</em>
        </h1>
        <p className="brand-subcopy">
          Meet brands you actually love, make culture-moving content, and get
          rewarded for being unmistakably you.
        </p>
      </div>

      <span className="floating-note note-one">Collabs, not cold DMs</span>
      <span className="floating-note note-two">Create. Earn. Repeat.</span>

      <div className="creator-proof">
        <div className="avatar-stack" aria-hidden="true">
          <span className="avatar">AK</span>
          <span className="avatar">M</span>
          <span className="avatar">RS</span>
        </div>
        <div className="proof-copy">
          <strong>15,000+ creators</strong>
          <span>already making their mark</span>
        </div>
      </div>
    </section>
  );
}
