import { Lightning, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "./brand-mark";
import { HolographicShader } from "./holographic-shader";

export function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="About the creator community">
      <HolographicShader />
      <div className="holographic-wash" aria-hidden="true" />

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

      <span className="floating-note note-one">
        <Sparkle size={15} weight="fill" aria-hidden="true" />
        Collabs, not cold DMs
      </span>
      <span className="floating-note note-two">
        <Lightning size={15} weight="fill" aria-hidden="true" />
        Create. Earn. Repeat.
      </span>

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
