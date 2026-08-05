import { brand } from "../lib/brand";

export function BrandMark() {
  return (
    <div className="brand-mark" aria-label={brand.name}>
      <img className="brand-monogram" src="/vf-logo.svg" alt="" aria-hidden="true" />
      <span>{brand.name}</span>
    </div>
  );
}
