# ViralFission Creator Club

An immersive signup experience for the creators shaping campus culture. This is
not a dashboard or a form card: it is a cinematic invitation that thanks people
for their taste, effort, and point of view.

## Run it locally

```bash
npm install
npm run dev
```

The development server prints a `Network` URL for phones on the same Wi-Fi. It
does not require ChatGPT sign-in.

## The visual system

One full-screen WebGL canvas powers the experience. The canvas transitions
between scenes using a Bayer-dither fracture, pointer displacement, scanlines,
and print-noise as creators move through the flow.

The bundled public-domain Met Open Access artwork is intentionally about the
work of being seen and heard:

- Edgar Degas, [*The Rehearsal Onstage*](https://www.metmuseum.org/art/collection/search/436156), ca. 1874.
- Henry Lerolle, [*The Organ Rehearsal*](https://www.metmuseum.org/art/collection/search/436880), 1885.
- Honoré Daumier, [*News of the Day*](https://www.metmuseum.org/art/collection/search/755534), 1867.

The social preview image was made specifically for this site and lives at
`public/og-creator-signal.png`.

## Structure

- `app/components/cinematic-shader.tsx`: artwork textures and shader transitions.
- `app/components/creator-onboarding.tsx`: eligibility, college, mobile, OTP, and app handoff states.
- `app/components/signup-experience.tsx`: joins signup state to the visual scene.

## Checks

```bash
npm run build
npm test
npm run lint
```
