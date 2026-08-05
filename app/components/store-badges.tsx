import { brand } from "../lib/brand";

export function StoreBadges() {
  return (
    <div className="store-links">
      <a
        className="store-badge app-store-link"
        href={brand.appStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Download ${brand.name} on the App Store`}
      >
        <img
          className="app-store-badge"
          src="/AppStore.svg"
          alt=""
        />
      </a>
      <a
        className="store-badge google-play-link"
        href={brand.playStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Get ${brand.name} on Google Play`}
      >
        <img
          className="google-play-badge"
          src="/googlePlay.svg"
          alt=""
        />
      </a>
    </div>
  );
}
