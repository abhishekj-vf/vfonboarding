"use client";

import { useCallback, useState } from "react";
import { CreatorOnboarding } from "./creator-onboarding";
import { VideoBackdrop } from "./video-backdrop";

export function SignupExperience() {
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
      <VideoBackdrop scene={scene} signal={signal} />
      <CreatorOnboarding onVisualChange={updateVisualState} />
    </main>
  );
}
