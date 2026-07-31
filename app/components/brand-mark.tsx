import { brand } from "../lib/brand";

export function BrandMark() {
  return (
    <div className="brand-mark" aria-label={brand.name}>
      <span className="brand-monogram" aria-hidden="true">
        VF
      </span>
      <span>{brand.name}</span>
    </div>
  );
}
