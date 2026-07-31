import { BrandPanel } from "./components/brand-panel";
import { CreatorOnboarding } from "./components/creator-onboarding";

export default function Home() {
  return (
    <main className="site-shell">
      <BrandPanel />
      <CreatorOnboarding />
    </main>
  );
}
