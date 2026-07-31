import { brand } from "../lib/brand";

export function StoreBadges() {
  return (
    <div className="store-links">
      <a
        className="store-badge"
        href={brand.appStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Download ${brand.name} on the App Store`}
      >
        <span className="store-icon" aria-hidden="true">
          
        </span>
        <span>
          <small>Download on the</small>
          <strong>App Store</strong>
        </span>
      </a>
      <a
        className="store-badge"
        href={brand.playStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Get ${brand.name} on Google Play`}
      >
        <span className="store-icon" aria-hidden="true">
          <span className="play-icon" />
        </span>
        <span>
          <small>GET IT ON</small>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}
