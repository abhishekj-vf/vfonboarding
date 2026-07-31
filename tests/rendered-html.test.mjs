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
    /<title>Join ViralFission \| Turn your influence into impact<\/title>/i,
  );
  assert.match(html, /ViralFission/);
  assert.match(html, /creator-ready/);
  assert.match(html, /Public profile/);
  assert.match(html, /5K\+ followers/);
  assert.match(html, /holographic-canvas/);
  assert.match(html, /og-holographic\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the interactive experience modular and production-ready", async () => {
  const [
    page,
    onboarding,
    shader,
    storeBadges,
    layout,
    packageJson,
    appleBadge,
    googleBadge,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/creator-onboarding.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/holographic-shader.tsx", import.meta.url),
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
  ]);

  assert.match(page, /<BrandPanel \/>/);
  assert.match(page, /<CreatorOnboarding \/>/);
  assert.doesNotMatch(page, /"use client"/);

  assert.match(onboarding, /"use client"/);
  assert.match(onboarding, /@phosphor-icons\/react/);
  assert.match(onboarding, /type Stage = "profile" \| "details" \| "otp"/);

  assert.match(shader, /fragmentShaderSource/);
  assert.match(shader, /getContext\("webgl"/);
  assert.match(shader, /prefers-reduced-motion/);

  assert.match(storeBadges, /download-on-app-store\.svg/);
  assert.match(storeBadges, /get-it-on-google-play\.png/);
  assert.ok(appleBadge.size > 1_000);
  assert.ok(googleBadge.size > 1_000);

  assert.match(layout, /og-holographic\.png/);
  assert.match(packageJson, /"@phosphor-icons\/react"/);

  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
