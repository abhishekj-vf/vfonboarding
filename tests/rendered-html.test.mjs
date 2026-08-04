import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the ViralFission creator signup", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>ViralFission \| Your point of view has a pulse<\/title>/i,
  );
  assert.match(html, /ViralFission/);
  assert.match(html, /Your point of view has a pulse/);
  assert.match(html, /Your Instagram/);
  assert.match(html, /video-backdrop/);
  assert.match(html, /video-shader-canvas/);
  assert.match(html, /og-creator-signal\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the interactive experience modular and production-ready", async () => {
  const [
    page,
    experience,
    onboarding,
    shader,
    storeBadges,
    layout,
    packageJson,
    appleBadge,
    googleBadge,
    degasArtwork,
    organArtwork,
    opinionArtwork,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/signup-experience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/creator-onboarding.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/cinematic-shader.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/store-badges.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    stat(new URL("../public/download-on-app-store.svg", import.meta.url)),
    stat(new URL("../public/get-it-on-google-play.png", import.meta.url)),
    stat(new URL("../public/degas-rehearsal.jpg", import.meta.url)),
    stat(new URL("../public/lerolle-organ-rehearsal.jpg", import.meta.url)),
    stat(new URL("../public/daumier-opinion.jpg", import.meta.url)),
  ]);

  assert.match(page, /<SignupExperience \/>/);
  assert.doesNotMatch(page, /"use client"/);

  assert.match(experience, /<VideoBackdrop/);
  assert.match(experience, /<CreatorOnboarding/);

  assert.match(onboarding, /"use client"/);
  assert.match(onboarding, /@phosphor-icons\/react/);
  assert.match(onboarding, /type Stage = "profile" \| "details" \| "otp"/);
  assert.match(onboarding, /Craft clocked\. Thank you/);
  assert.match(onboarding, /onVisualChange/);

  assert.match(shader, /const fragmentShader/);
  assert.match(shader, /getContext\("webgl"/);
  assert.match(shader, /prefers-reduced-motion/);
  assert.match(shader, /u_scene0/);
  assert.match(shader, /bayer4/);
  assert.match(shader, /u_transition/);

  assert.match(storeBadges, /download-on-app-store\.svg/);
  assert.match(storeBadges, /get-it-on-google-play\.png/);
  assert.ok(appleBadge.size > 1_000);
  assert.ok(googleBadge.size > 1_000);
  assert.ok(degasArtwork.size > 1_000_000);
  assert.ok(organArtwork.size > 1_000_000);
  assert.ok(opinionArtwork.size > 1_000_000);

  assert.match(layout, /og-creator-signal\.png/);
  assert.match(packageJson, /"@phosphor-icons\/react"/);

  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
