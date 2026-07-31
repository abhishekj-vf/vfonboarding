"use client";

import { useCallback, useState } from "react";
import { CinematicShader } from "./cinematic-shader";
import { CreatorOnboarding } from "./creator-onboarding";

const lockedPrintSettings = {
  dotScale: 3,
  dotStrength: 1,
  posterization: 8,
};

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
      <CinematicShader scene={scene} signal={signal} settings={lockedPrintSettings} />
      <div className="signal-grain" aria-hidden="true" />
      <CreatorOnboarding onVisualChange={updateVisualState} />
    </main>
  );
}
