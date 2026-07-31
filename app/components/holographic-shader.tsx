"use client";

import { useEffect, useRef } from "react";

export type ShaderVariant = "newsprint" | "nocturne" | "tritone";

const ARTWORK_ASPECT = 3854 / 2594;

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform sampler2D u_artwork;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_variant;
  uniform float u_signal;
  uniform float u_artwork_aspect;

  float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  float random(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float bayer4(vec2 point) {
    vec2 cell = mod(floor(point), 4.0);
    float x = cell.x;
    float y = cell.y;

    if (y < 1.0) {
      if (x < 1.0) return 0.0 / 16.0;
      if (x < 2.0) return 8.0 / 16.0;
      if (x < 3.0) return 2.0 / 16.0;
      return 10.0 / 16.0;
    }
    if (y < 2.0) {
      if (x < 1.0) return 12.0 / 16.0;
      if (x < 2.0) return 4.0 / 16.0;
      if (x < 3.0) return 14.0 / 16.0;
      return 6.0 / 16.0;
    }
    if (y < 3.0) {
      if (x < 1.0) return 3.0 / 16.0;
      if (x < 2.0) return 11.0 / 16.0;
      if (x < 3.0) return 1.0 / 16.0;
      return 9.0 / 16.0;
    }
    if (x < 1.0) return 15.0 / 16.0;
    if (x < 2.0) return 7.0 / 16.0;
    if (x < 3.0) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }

  vec2 coverUv(vec2 uv) {
    float viewportAspect = u_resolution.x / u_resolution.y;
    vec2 artworkUv = uv;

    if (viewportAspect > u_artwork_aspect) {
      artworkUv.y = (uv.y - 0.5) * (u_artwork_aspect / viewportAspect) + 0.5;
    } else {
      artworkUv.x = (uv.x - 0.5) * (viewportAspect / u_artwork_aspect) + 0.5;
    }

    return artworkUv;
  }

  float halftoneMask(float tone, float scale, float rotation) {
    float cosine = cos(rotation);
    float sine = sin(rotation);
    mat2 turn = mat2(cosine, -sine, sine, cosine);
    vec2 cells = turn * gl_FragCoord.xy / scale;
    float distanceToCentre = length(fract(cells) - 0.5);
    float radius = mix(0.12, 0.52, 1.0 - tone);
    return 1.0 - smoothstep(radius - 0.055, radius + 0.055, distanceToCentre);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 pointerOffset = (u_pointer - 0.5) * (0.012 + u_signal * 0.014);
    vec2 artworkUv = coverUv(uv) + pointerOffset;

    float slowPressDrift = sin(
      artworkUv.y * 18.0 + u_time * 0.35 + u_signal * 3.14159
    );
    artworkUv.x += slowPressDrift * (0.0012 + u_signal * 0.0016);

    vec3 artwork = texture2D(u_artwork, clamp(artworkUv, 0.001, 0.999)).rgb;
    float tone = luminance(artwork);
    float blue = clamp(artwork.b - artwork.r * 0.42, 0.0, 1.0);
    float interaction = exp(-9.0 * distance(uv, u_pointer));
    float printGrain = random(floor(gl_FragCoord.xy * 0.5) + floor(u_time * 3.0));
    float threshold = bayer4(gl_FragCoord.xy + floor(u_signal * 4.0));
    vec3 color;

    if (u_variant < 0.5) {
      float dots = halftoneMask(tone, 5.2 + u_signal * 2.8, -0.20);
      float blueDots = halftoneMask(
        clamp(1.0 - blue, 0.0, 1.0),
        7.4 + u_signal * 1.8,
        0.22
      );
      vec3 paper = vec3(0.956, 0.908, 0.784);
      vec3 ink = vec3(0.075, 0.067, 0.060);
      vec3 indigo = vec3(0.035, 0.205, 0.345);
      color = mix(paper, ink, dots * 0.94);
      color = mix(color, indigo, blueDots * blue * 0.84);
      color = mix(color, artwork, interaction * (0.10 + u_signal * 0.18));
    } else if (u_variant < 1.5) {
      float ditheredLight = step(threshold, pow(tone, 0.82));
      float ditheredBlue = step(threshold, clamp(blue * 1.35, 0.0, 1.0));
      vec3 midnight = vec3(0.016, 0.032, 0.090);
      vec3 cobalt = vec3(0.045, 0.285, 0.490);
      vec3 moonlight = vec3(0.825, 0.930, 0.895);
      color = mix(midnight, cobalt, ditheredBlue);
      color = mix(color, moonlight, ditheredLight * 0.86);
      float fineDots = halftoneMask(tone, 8.0 - u_signal * 2.0, 0.34);
      color = mix(color, vec3(0.62, 0.91, 0.93), fineDots * blue * 0.18);
    } else {
      float adjustedTone = clamp(tone + (threshold - 0.5) * 0.25, 0.0, 1.0);
      vec3 ink = vec3(0.070, 0.055, 0.075);
      vec3 vermilion = vec3(0.875, 0.245, 0.165);
      vec3 cream = vec3(0.975, 0.885, 0.660);
      vec3 waveBlue = vec3(0.055, 0.300, 0.455);
      color = adjustedTone < 0.32
        ? ink
        : (adjustedTone < 0.68 ? vermilion : cream);
      color = mix(color, waveBlue, step(0.24, blue) * 0.82);
      float dotScreen = halftoneMask(tone, 6.4 + u_signal * 2.2, -0.12);
      color = mix(color, ink, dotScreen * (1.0 - tone) * 0.22);
    }

    float focusRing = smoothstep(0.19, 0.0, abs(distance(uv, u_pointer) - 0.115));
    color += focusRing * (0.018 + u_signal * 0.022);
    color += (printGrain - 0.5) * 0.026;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const variantValue: Record<ShaderVariant, number> = {
  newsprint: 0,
  nocturne: 1,
  tritone: 2,
};

type HolographicShaderProps = {
  className?: string;
  signal?: number;
  variant?: ShaderVariant;
};

export function HolographicShader({
  className = "",
  signal = 0,
  variant = "newsprint",
}: HolographicShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalRef = useRef(signal);
  const variantRef = useRef(variant);

  useEffect(() => {
    signalRef.current = Math.min(Math.max(signal, 0), 1);
  }, [signal]);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([236, 224, 194, 255]),
    );

    const artwork = new Image();
    artwork.decoding = "async";
    artwork.src = "/hokusai-great-wave.jpg";
    artwork.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        artwork,
      );
    };

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const artworkLocation = gl.getUniformLocation(program, "u_artwork");
    const artworkAspectLocation = gl.getUniformLocation(
      program,
      "u_artwork_aspect",
    );
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const variantLocation = gl.getUniformLocation(program, "u_variant");
    const signalLocation = gl.getUniformLocation(program, "u_signal");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationFrame = 0;
    let pointerX = 0.64;
    let pointerY = 0.46;
    let startTime = performance.now();

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render(now: number) {
      resize();
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1i(artworkLocation, 0);
      gl.uniform1f(artworkAspectLocation, ARTWORK_ASPECT);
      gl.uniform1f(timeLocation, (now - startTime) / 1000);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, pointerX, pointerY);
      gl.uniform1f(variantLocation, variantValue[variantRef.current]);
      gl.uniform1f(signalLocation, signalRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(render);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width;
      pointerY = 1 - (event.clientY - bounds.top) / bounds.height;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else if (!reducedMotion) {
        startTime = performance.now();
        animationFrame = requestAnimationFrame(render);
      }
    }

    function handleResize() {
      resize();
      if (reducedMotion) render(performance.now());
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    render(performance.now());

    return () => {
      artwork.onload = null;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`holographic-canvas ${className}`.trim()}
      aria-label="Interactive print shader using Hokusai's Great Wave"
      role="img"
    />
  );
}
