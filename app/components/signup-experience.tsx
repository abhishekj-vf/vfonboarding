"use client";

import { useState } from "react";
import { BrandPanel } from "./brand-panel";
import { CreatorOnboarding } from "./creator-onboarding";
import {
  HolographicShader,
  type ShaderVariant,
} from "./holographic-shader";

export function SignupExperience() {
  const [shaderMode, setShaderMode] =
    useState<ShaderVariant>("newsprint");
  const [shaderSignal, setShaderSignal] = useState(0);

  return (
    <main className={`site-shell shader-${shaderMode}`}>
      <HolographicShader
        className="global-shader"
        variant={shaderMode}
        signal={shaderSignal}
      />
      <div className="global-paper-grain" aria-hidden="true" />
      <BrandPanel />
      <CreatorOnboarding
        shaderMode={shaderMode}
        onShaderModeChange={setShaderMode}
        onShaderSignalChange={setShaderSignal}
      />
    </main>
  );
}
