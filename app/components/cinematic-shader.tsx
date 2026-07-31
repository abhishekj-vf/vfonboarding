"use client";

import { useEffect, useRef } from "react";

const sceneSources = [
  "/degas-rehearsal.jpg",
  "/lerolle-organ-rehearsal.jpg",
  "/daumier-opinion.jpg",
] as const;

const sceneAspects = [3811 / 2818, 3919 / 2622, 3430 / 3530] as const;

export type ShaderSettings = {
  dotScale: number;
  dotStrength: number;
  posterization: number;
};

const vertexShader = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D u_scene0;
  uniform sampler2D u_scene1;
  uniform sampler2D u_scene2;
  uniform vec3 u_aspects;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  uniform float u_from;
  uniform float u_to;
  uniform float u_transition;
  uniform float u_signal;
  uniform float u_dotScale;
  uniform float u_dotStrength;
  uniform float u_posterization;

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

  vec2 coverUv(vec2 uv, float artworkAspect) {
    float screenAspect = u_resolution.x / u_resolution.y;
    vec2 outUv = uv;
    if (screenAspect > artworkAspect) {
      outUv.y = (uv.y - 0.5) * (artworkAspect / screenAspect) + 0.5;
    } else {
      outUv.x = (uv.x - 0.5) * (screenAspect / artworkAspect) + 0.5;
    }
    return outUv;
  }

  vec3 sampleScene(float scene, vec2 uv) {
    if (scene < 0.5) return texture2D(u_scene0, coverUv(uv, u_aspects.x)).rgb;
    if (scene < 1.5) return texture2D(u_scene1, coverUv(uv, u_aspects.y)).rgb;
    return texture2D(u_scene2, coverUv(uv, u_aspects.z)).rgb;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 outgoing = sampleScene(u_from, uv);
    vec3 incoming = sampleScene(u_to, uv);

    // An ordered print-screen transition: the scene resolves in dithered blocks,
    // rather than warping the artwork like water.
    float blocks = bayer4(floor(gl_FragCoord.xy * 0.38));
    float signalNoise = random(floor(gl_FragCoord.xy * 0.08) + floor(u_time * 3.0));
    float fracture = mix(blocks, signalNoise, 0.24);
    float transition = smoothstep(
      fracture - 0.14 - u_signal * 0.06,
      fracture + 0.14,
      u_transition
    );
    vec3 art = mix(outgoing, incoming, transition);

    float luminance = dot(art, vec3(0.299, 0.587, 0.114));
    float scale = max(2.8, u_dotScale - u_signal * 1.4);
    mat2 blueAngle = mat2(0.94, -0.34, 0.34, 0.94);
    mat2 redAngle = mat2(0.72, -0.69, 0.69, 0.72);
    mat2 yellowAngle = mat2(0.98, 0.20, -0.20, 0.98);
    vec2 cellBlue = fract(blueAngle * (gl_FragCoord.xy / scale)) - 0.5;
    vec2 cellRed = fract(redAngle * (gl_FragCoord.xy / (scale + 0.8))) - 0.5;
    vec2 cellYellow = fract(yellowAngle * (gl_FragCoord.xy / (scale + 1.7))) - 0.5;
    float cyanDot = 1.0 - smoothstep(0.16, 0.45, length(cellBlue) + luminance * 0.26);
    float redDot = 1.0 - smoothstep(0.15, 0.44, length(cellRed) + luminance * 0.20);
    float yellowDot = 1.0 - smoothstep(0.18, 0.45, length(cellYellow) + luminance * 0.18);
    vec3 printed = art;
    printed = mix(printed, vec3(0.03, 0.18, 0.62), cyanDot * 0.20 * u_dotStrength);
    printed = mix(printed, vec3(0.92, 0.13, 0.27), redDot * 0.13 * u_dotStrength);
    printed = mix(printed, vec3(0.88, 0.91, 0.09), yellowDot * 0.10 * u_dotStrength);

    float ordered = bayer4(gl_FragCoord.xy) - 0.5;
    printed = floor(clamp(printed + ordered * 0.08, 0.0, 1.0) * u_posterization + 0.5) / u_posterization;
    float pointerHalo = exp(-17.0 * distance(uv, u_pointer));
    printed += pointerHalo * vec3(0.055, 0.095, 0.16) * (0.35 + u_signal * 0.65);
    printed += (random(floor(gl_FragCoord.xy * 0.55) + floor(u_time * 2.0)) - 0.5) * 0.025;

    gl_FragColor = vec4(printed, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
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

type CinematicShaderProps = {
  scene: number;
  signal: number;
  settings: ShaderSettings;
};

export function CinematicShader({ scene, signal, settings }: CinematicShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef(scene);
  const signalRef = useRef(signal);
  const settingsRef = useRef(settings);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    signalRef.current = Math.min(Math.max(signal, 0), 1);
  }, [signal]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
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

    const textures = sceneSources.map((source) => {
      const texture = gl.createTexture();
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
        new Uint8Array([21, 16, 28, 255]),
      );

      const image = new Image();
      image.decoding = "async";
      image.src = source;
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      };
      return { image, texture };
    });

    const position = gl.getAttribLocation(program, "a_position");
    const locations = {
      scene0: gl.getUniformLocation(program, "u_scene0"),
      scene1: gl.getUniformLocation(program, "u_scene1"),
      scene2: gl.getUniformLocation(program, "u_scene2"),
      aspects: gl.getUniformLocation(program, "u_aspects"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      time: gl.getUniformLocation(program, "u_time"),
      from: gl.getUniformLocation(program, "u_from"),
      to: gl.getUniformLocation(program, "u_to"),
      transition: gl.getUniformLocation(program, "u_transition"),
      signal: gl.getUniformLocation(program, "u_signal"),
      dotScale: gl.getUniformLocation(program, "u_dotScale"),
      dotStrength: gl.getUniformLocation(program, "u_dotStrength"),
      posterization: gl.getUniformLocation(program, "u_posterization"),
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointer = { x: 0.54, y: 0.48 };
    let frame = 0;
    let activeScene = sceneRef.current;
    let previousScene = activeScene;
    let transitionStarted = performance.now();

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
      if (sceneRef.current !== activeScene) {
        previousScene = activeScene;
        activeScene = sceneRef.current;
        transitionStarted = now;
      }
      resize();
      const transition = reducedMotion
        ? 1
        : Math.min((now - transitionStarted) / 850, 1);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      textures.forEach(({ texture }, index) => {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      });
      gl.uniform1i(locations.scene0, 0);
      gl.uniform1i(locations.scene1, 1);
      gl.uniform1i(locations.scene2, 2);
      gl.uniform3f(locations.aspects, sceneAspects[0], sceneAspects[1], sceneAspects[2]);
      gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      gl.uniform2f(locations.pointer, pointer.x, pointer.y);
      gl.uniform1f(locations.time, now / 1000);
      gl.uniform1f(locations.from, previousScene);
      gl.uniform1f(locations.to, activeScene);
      gl.uniform1f(locations.transition, transition);
      gl.uniform1f(locations.signal, signalRef.current);
      gl.uniform1f(locations.dotScale, settingsRef.current.dotScale);
      gl.uniform1f(locations.dotStrength, settingsRef.current.dotStrength);
      gl.uniform1f(locations.posterization, settingsRef.current.posterization);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) frame = requestAnimationFrame(render);
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      pointer = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: 1 - (event.clientY - bounds.top) / bounds.height,
      };
    }

    function onResize() {
      resize();
      if (reducedMotion) render(performance.now());
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    render(performance.now());

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      textures.forEach(({ image, texture }) => {
        image.onload = null;
        gl.deleteTexture(texture);
      });
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas className="cinematic-canvas" ref={canvasRef} aria-hidden="true" />;
}
