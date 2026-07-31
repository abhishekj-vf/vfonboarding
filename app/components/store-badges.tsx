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
        <img
          className="app-store-badge"
          src="/download-on-app-store.svg"
          alt=""
        />
      </a>
      <a
        className="store-badge"
        href={brand.playStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Get ${brand.name} on Google Play`}
      >
        <img
          className="google-play-badge"
          src="/get-it-on-google-play.png"
          alt=""
        />
      </a>
    </div>
  );
}
