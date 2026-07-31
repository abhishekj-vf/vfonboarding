"use client";

import { useCallback, useState } from "react";
import { CinematicShader, ShaderSettings } from "./cinematic-shader";
import { CreatorOnboarding } from "./creator-onboarding";
import { ShaderControls } from "./shader-controls";

export function SignupExperience() {
  const [scene, setScene] = useState(0);
  const [signal, setSignal] = useState(0);
  const [shaderSettings, setShaderSettings] = useState<ShaderSettings>({
    dotScale: 6.4,
    dotStrength: 1,
    posterization: 7,
  });

  const updateVisualState = useCallback(
    (nextScene: number, nextSignal: number) => {
      setScene(nextScene);
      setSignal(nextSignal);
    },
    [],
  );

  return (
    <main className="site-shell">
      <CinematicShader scene={scene} signal={signal} settings={shaderSettings} />
      <div className="signal-grain" aria-hidden="true" />
      <CreatorOnboarding onVisualChange={updateVisualState} />
      <ShaderControls settings={shaderSettings} onChange={setShaderSettings} />
    </main>
  );
}
