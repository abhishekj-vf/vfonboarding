"use client";

import { useEffect, useRef } from "react";

export type ShaderVariant = "aurora" | "midnight" | "prism";

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_variant;
  uniform float u_signal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 pointer = u_pointer - 0.5;
    pointer.x *= u_resolution.x / u_resolution.y;
    float pointerGlow = exp(-3.6 * length(p - pointer));

    float t = u_time * (0.1 + u_signal * 0.12);
    float foldA = sin((p.x * 2.2 + p.y * 1.4) * 3.2 + t * 2.0);
    float foldB = sin((p.y * 3.0 - p.x * 1.1) * 2.3 - t * 1.4);
    float field = 0.5 + 0.5 * sin(foldA + foldB + noise(p * 2.3 + t) * 2.8);

    vec3 violet = vec3(0.40, 0.24, 0.78);
    vec3 lilac = vec3(0.69, 0.55, 0.98);
    vec3 cyan = vec3(0.33, 0.90, 0.91);
    vec3 lime = vec3(0.82, 1.00, 0.30);
    vec3 rose = vec3(1.00, 0.39, 0.65);

    vec3 color;

    if (u_variant < 0.5) {
      color = mix(violet, lilac, smoothstep(0.05, 0.85, uv.y));
      color = mix(color, cyan, smoothstep(0.48, 1.0, field) * 0.58);
      color = mix(color, lime, smoothstep(0.68, 1.0, sin(field * 4.2 + uv.x * 3.0) * 0.5 + 0.5) * 0.46);
      color = mix(color, rose, smoothstep(0.75, 1.0, cos(field * 5.1 - uv.y * 4.0) * 0.5 + 0.5) * 0.22);
    } else if (u_variant < 1.5) {
      float radius = length(p + vec2(
        sin(t * 0.8 + p.y * 2.0) * 0.15,
        cos(t * 0.7 + p.x * 2.4) * 0.12
      ));
      float liquid = 0.5 + 0.5 * sin(radius * 15.0 - t * 4.0 + foldA * 1.4);
      vec3 ink = vec3(0.015, 0.012, 0.055);
      vec3 indigo = vec3(0.16, 0.10, 0.52);
      vec3 electric = vec3(0.06, 0.76, 0.92);
      vec3 magenta = vec3(0.92, 0.10, 0.58);
      color = mix(ink, indigo, smoothstep(0.0, 0.9, uv.y + liquid * 0.3));
      color = mix(color, electric, smoothstep(0.62, 1.0, liquid) * (0.48 + u_signal * 0.2));
      color = mix(color, magenta, smoothstep(0.7, 1.0, field) * 0.38);
    } else {
      float band = fract((p.x + p.y * 0.72) * 1.7 + field * 0.34 - t * 0.4);
      float edge = smoothstep(0.22, 0.5, band) - smoothstep(0.58, 0.88, band);
      vec3 pearl = vec3(0.97, 0.94, 0.99);
      vec3 sky = vec3(0.40, 0.84, 0.97);
      vec3 orchid = vec3(0.72, 0.42, 0.92);
      color = mix(pearl, sky, smoothstep(0.08, 0.92, uv.x + field * 0.22));
      color = mix(color, orchid, edge * 0.58);
      color = mix(color, lime, smoothstep(0.78, 1.0, band) * 0.34);
      color = mix(color, rose, smoothstep(0.0, 0.18, band) * (0.12 + u_signal * 0.2));
    }

    float sheen = pow(max(0.0, sin((uv.x + uv.y) * 8.0 - t * 3.0)), 12.0);
    color += sheen * vec3(0.42, 0.35, 0.52);
    color += pointerGlow * vec3(0.12, 0.10, 0.18) * (0.72 + u_signal * 1.4);
    color += sin(u_signal * 3.14159) * 0.035 * vec3(0.4, 0.8, 1.0);

    float grain = hash(gl_FragCoord.xy + u_time) - 0.5;
    color += grain * 0.035;

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
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const variantValue: Record<ShaderVariant, number> = {
  aurora: 0,
  midnight: 1,
  prism: 2,
};

type HolographicShaderProps = {
  className?: string;
  signal?: number;
  variant?: ShaderVariant;
};

export function HolographicShader({
  className = "",
  signal = 0,
  variant = "aurora",
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
      antialias: true,
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const variantLocation = gl.getUniformLocation(program, "u_variant");
    const signalLocation = gl.getUniformLocation(program, "u_signal");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationFrame = 0;
    let pointerX = 0.72;
    let pointerY = 0.34;
    let startTime = performance.now();

    function resize() {
      if (!canvas || !gl) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render(now: number) {
      if (!canvas || !gl) return;
      resize();
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
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
      if (reducedMotion) {
        render(performance.now());
      }
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      aria-hidden="true"
    />
  );
}
