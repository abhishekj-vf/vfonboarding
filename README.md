# ViralFission creator signup

Mobile-first creator onboarding for ViralFission. The signup flow checks an
Instagram handle, collects college and Indian mobile details, verifies a demo
OTP, and hands eligible creators off to the native apps.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

The dev command binds to `0.0.0.0`. It prints both:

- `Local`: open this URL on the development computer.
- `Network`: open this URL on a phone connected to the same Wi-Fi.

If Windows asks whether Node.js may accept connections on the local network,
allow private-network access. This project does not require ChatGPT sign-in.

## Useful commands

```bash
npm run build
npm test
npm run lint
```

## Visual system

The page uses one WebGL canvas behind both desktop columns. The three selectable
print modes all process the same locally bundled artwork:

- `Newsprint`: rotated halftone screens with indigo ink.
- `Nocturne`: a 4×4 Bayer ordered-dither treatment.
- `Tritone`: an ink, vermilion, cream, and wave-blue poster treatment.

Pointer movement shifts the print registration subtly. Form completion changes
the dot scale, drift, and interaction intensity.

The source artwork is Vincent van Gogh’s *Irises*, 1890. The local image comes
from [The Metropolitan Museum of Art Open Access collection](https://www.metmuseum.org/art/collection/search/436528)
and is marked public domain.

## Project structure

- `app/components/signup-experience.tsx`: shared shader state and page shell.
- `app/components/holographic-shader.tsx`: WebGL artwork and print shaders.
- `app/components/creator-onboarding.tsx`: multi-step signup flow.
- `app/components/brand-panel.tsx`: desktop creator-community panel.
- `app/lib/eligibility.ts`: preview eligibility logic.
