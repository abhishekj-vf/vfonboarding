"use client";

import { SlidersHorizontal } from "@phosphor-icons/react";
import type { ShaderSettings } from "./cinematic-shader";

type ShaderControlsProps = {
  settings: ShaderSettings;
  onChange: (settings: ShaderSettings) => void;
};

export function ShaderControls({ settings, onChange }: ShaderControlsProps) {
  function update<K extends keyof ShaderSettings>(key: K, value: number) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <details className="shader-controls">
      <summary><SlidersHorizontal size={16} weight="bold" /> Print controls</summary>
      <div className="shader-controls__body">
        <label>Dot size <output>{settings.dotScale.toFixed(1)}</output><input aria-label="Halftone dot size" type="range" min="3" max="9" step="0.2" value={settings.dotScale} onChange={(event) => update("dotScale", Number(event.target.value))} /></label>
        <label>Ink <output>{Math.round(settings.dotStrength * 100)}%</output><input aria-label="Halftone ink strength" type="range" min="0" max="1" step="0.05" value={settings.dotStrength} onChange={(event) => update("dotStrength", Number(event.target.value))} /></label>
        <label>Colour steps <output>{settings.posterization}</output><input aria-label="Dither color steps" type="range" min="3" max="10" step="1" value={settings.posterization} onChange={(event) => update("posterization", Number(event.target.value))} /></label>
      </div>
    </details>
  );
}
