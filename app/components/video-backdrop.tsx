"use client";

import { useEffect, useRef, useState } from "react";

const initialDesktopColumns: string[][] = [
  ["/videos/clip-01.mp4", "/videos/clip-04.mp4", "/videos/clip-07.mp4", "/videos/clip-10.mp4"],
  ["/videos/clip-02.mp4", "/videos/clip-05.mp4", "/videos/clip-08.mp4", "/videos/clip-11.mp4"],
  ["/videos/clip-03.mp4", "/videos/clip-06.mp4", "/videos/clip-09.mp4", "/videos/clip-12.mp4"],
];

const initialMobileScenes = [
  "/videos/clip-01.mp4",
  "/videos/clip-06.mp4",
  "/videos/clip-11.mp4",
];

const videoPool = Array.from({ length: 17 }, (_, index) => `/videos/clip-${String(index + 1).padStart(2, "0")}.mp4`);

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

type VideoBackdropProps = {
  scene: number;
  signal: number;
};

const tileVertexShader = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const tileFragmentShader = `
  precision highp float;

  uniform sampler2D u_video;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_videoAspect;
  uniform float u_time;
  uniform float u_signal;
  uniform float u_variant;

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
    float screenAspect = u_resolution.x / u_resolution.y;
    vec2 outUv = uv;
    if (screenAspect > u_videoAspect) {
      outUv.y = (uv.y - 0.5) * (u_videoAspect / screenAspect) + 0.5;
    } else {
      outUv.x = (uv.x - 0.5) * (screenAspect / u_videoAspect) + 0.5;
    }
    return outUv;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 sampleUv = coverUv(uv);
    vec3 video = texture2D(u_video, sampleUv).rgb;
    float luminance = dot(video, vec3(0.299, 0.587, 0.114));

    float dotScale = mix(5.3, 3.0, u_signal);
    vec2 animatedGrid = gl_FragCoord.xy / dotScale;
    animatedGrid += vec2(u_time * (0.18 + u_variant * 0.02), -u_time * 0.08);
    vec2 cell = fract(animatedGrid) - 0.5;
    float dotInk = 1.0 - smoothstep(0.17, 0.49, length(cell) + luminance * 0.23);
    float ordered = bayer4(gl_FragCoord.xy * 0.55) - 0.5;
    float ditheredLuma = floor(clamp(luminance + ordered * 0.12, 0.0, 1.0) * 6.0 + 0.5) / 6.0;
    float noise = (random(floor(gl_FragCoord.xy * 0.42) + floor(u_time * 3.0) + u_variant) - 0.5) * 0.06;
    float pointerHalo = exp(-20.0 * distance(uv, u_pointer));

    vec3 printInk = mix(vec3(0.015, 0.012, 0.025), vec3(0.84, 0.96, 0.12), ditheredLuma);
    printInk += pointerHalo * vec3(0.06, 0.11, 0.16);
    printInk += noise;
    vec3 result = mix(video, printInk, 0.28 + dotInk * 0.38);
    result += vec3(0.02, 0.01, 0.04) * (1.0 - dotInk) * 0.12;
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
  }
`;

function compileTileShader(gl: WebGLRenderingContext, type: number, source: string) {
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

function VideoTile({ source, variant, signal }: { source: string; variant: number; signal: number }) {
  const tileRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalRef = useRef(signal);
  const [shaderReady, setShaderReady] = useState(false);

  useEffect(() => {
    signalRef.current = signal;
  }, [signal]);

  useEffect(() => {
    const tile = tileRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!tile || !video || !canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const vertex = compileTileShader(gl, gl.VERTEX_SHADER, tileVertexShader);
    const fragment = compileTileShader(gl, gl.FRAGMENT_SHADER, tileFragmentShader);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([18, 14, 24, 255]),
    );

    const position = gl.getAttribLocation(program, "a_position");
    const locations = {
      video: gl.getUniformLocation(program, "u_video"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      videoAspect: gl.getUniformLocation(program, "u_videoAspect"),
      time: gl.getUniformLocation(program, "u_time"),
      signal: gl.getUniformLocation(program, "u_signal"),
      variant: gl.getUniformLocation(program, "u_variant"),
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointer = { x: 0.5, y: 0.5 };
    let frame = 0;
    let hasFrame = false;
    let lastRender = 0;

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(tile.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(tile.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render(now: number) {
      if (!reducedMotion && now - lastRender < 33) {
        frame = requestAnimationFrame(render);
        return;
      }
      lastRender = now;
      resize();
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        if (!hasFrame) {
          hasFrame = true;
          setShaderReady(true);
        }
      }
      gl.uniform1i(locations.video, 0);
      gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      gl.uniform2f(locations.pointer, pointer.x, pointer.y);
      gl.uniform1f(locations.videoAspect, video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 1);
      gl.uniform1f(locations.time, now / 1000);
      gl.uniform1f(locations.signal, signalRef.current);
      gl.uniform1f(locations.variant, variant);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion) frame = requestAnimationFrame(render);
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = tile.getBoundingClientRect();
      pointer = {
        x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
        y: 1 - Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
      };
    }

    function onPointerLeave() {
      pointer = { x: 0.5, y: 0.5 };
    }

    void video.play().catch(() => undefined);
    tile.addEventListener("pointermove", onPointerMove, { passive: true });
    tile.addEventListener("pointerleave", onPointerLeave, { passive: true });
    render(performance.now());

    return () => {
      cancelAnimationFrame(frame);
      tile.removeEventListener("pointermove", onPointerMove);
      tile.removeEventListener("pointerleave", onPointerLeave);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [source, variant]);

  return (
    <div className="video-tile" ref={tileRef}>
      <video
        ref={videoRef}
        className={shaderReady ? "is-shader-hidden" : ""}
        src={source}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <canvas className="video-shader-canvas" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

export function VideoBackdrop({ scene, signal }: VideoBackdropProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopColumns, setDesktopColumns] = useState<string[][]>(initialDesktopColumns);
  const [mobileScenes, setMobileScenes] = useState<string[]>(initialMobileScenes);
  const mobileSource = mobileScenes[Math.abs(scene) % mobileScenes.length];

  useEffect(() => {
    const media = window.matchMedia("(min-width: 781px)");
    const updateViewport = () => setIsDesktop(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const randomized = shuffle(videoPool);
    try {
      const previousFirst = window.sessionStorage.getItem("vf-mobile-first-video");
      if (previousFirst && randomized[0] === previousFirst) {
        [randomized[0], randomized[1]] = [randomized[1], randomized[0]];
      }
      window.sessionStorage.setItem("vf-mobile-first-video", randomized[0]);
    } catch {
      // Storage can be unavailable in private browsing; randomness still works.
    }

    const randomizeFrame = window.requestAnimationFrame(() => {
      setMobileScenes(randomized.slice(0, 3));
      setDesktopColumns([
        randomized.slice(3, 7),
        randomized.slice(7, 11),
        randomized.slice(11, 15),
      ]);
    });
    return () => window.cancelAnimationFrame(randomizeFrame);
  }, []);

  return (
    <div className="video-backdrop" aria-hidden="true">
      {isDesktop && (
        <div className="video-grid">
          {desktopColumns.map((column, columnIndex) => {
            const loopedColumn = [...column, ...column];
            return (
              <div
                className={`video-column${columnIndex === 1 ? " is-reverse" : ""}`}
                key={`column-${columnIndex}`}
              >
                <div className="video-column-track">
                  {loopedColumn.map((source, index) => (
                    <VideoTile key={`${source}-${index}`} source={source} variant={columnIndex * 4 + index} signal={signal} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isDesktop && (
        <div className="mobile-video-frame">
          <VideoTile key={mobileSource} source={mobileSource} variant={scene} signal={signal} />
        </div>
      )}
      <div className="video-vignette" />
    </div>
  );
}
