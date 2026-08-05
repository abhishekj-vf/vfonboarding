"use client";

import { useCallback, useState } from "react";
import { CreatorOnboarding } from "./creator-onboarding";
import { VideoBackdrop } from "./video-backdrop";

type SignupExperienceProps = {
  mobileGrid?: boolean;
};

export function SignupExperience({ mobileGrid = false }: SignupExperienceProps) {
  const [scene, setScene] = useState(0);
  const [signal, setSignal] = useState(0);

  const updateVisualState = useCallback(
    (nextScene: number, nextSignal: number) => {
      setScene(nextScene);
      setSignal(nextSignal);
    },
    [],
  );

  return (
    <main className="site-shell">
      <VideoBackdrop scene={scene} signal={signal} mobileGrid={mobileGrid} />
      <CreatorOnboarding onVisualChange={updateVisualState} />
    </main>
  );
}
