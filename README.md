# fixray

AR repair assistant: point the phone camera at something broken and get a highlighted region, a direction arrow and one instruction on the live feed, gated by a green / amber / red safety rating. See [`fixray-project-spec.md`](./fixray-project-spec.md) for the product and stack rationale; visuals follow the Claude Design project **Fixray Flow v2**.

This phase is the mobile core flow only: **camera → `/api/diagnose` → overlay → safety flag → solution → parts link**. Diagnosis is mocked. No database, auth, desktop dashboard or PWA manifest yet (deferred per spec).

## Setup

Requires Node 20+ and pnpm 9.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

`localhost` counts as a secure context, so the camera works on your desktop browser directly.

### Testing on an iPhone

iOS Safari only grants camera access over HTTPS — a LAN IP over HTTP won't work. Tunnel the dev server:

```bash
cloudflared tunnel --url http://localhost:3000
```

Open the printed `https://….trycloudflare.com` URL on the phone. `next.config.ts` already allows that origin for dev assets and hot reload.

### Scripts

| Command | |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |

## Flow

| Route | Screen |
|---|---|
| `/` | First run (rating explainer + camera access) on first visit, then Home with the scan action and recent repairs |
| `/scan` | Full-screen camera, canvas overlay, live instruction panel, amber gate and red stop |
| `/solution` | Diagnosis, overall rating, the steps |
| `/parts` | Identified part and outbound retailer search links |

In development, `/scan` shows a **MOCK green / amber / red** switch to exercise each safety state.

- **Green** — instruction panel, overlay in mint.
- **Amber** — the panel is replaced by a shut-off gate that must be confirmed before instructions show.
- **Red** — polling stops, the camera shrinks, and a stop band explains the hazard with what's still safe, a "find a licensed pro" link (Google Maps search) and a re-check action.

## Structure

```
src/
  app/
    page.tsx                 first run + home
    scan/page.tsx            camera screen and its panels
    solution/page.tsx
    parts/page.tsx
    api/diagnose/route.ts    POST { image: dataURL, mock? } → { diagnosis, provider, ms }
  components/
    OverlayCanvas.tsx        canvas renderer: reticle, ring/box highlight, arrows, callout
    RedStop.tsx              red interrupt
    ui.tsx                   wordmark, safety chips, buttons
  lib/
    diagnosis/types.ts       Diagnosis contract (regions are normalized 0–1 frame coords)
    diagnosis/mock.ts        faucet-drip scenario
    diagnosis/index.ts       provider switch — the swap point for a real vision model
    useCamera.ts             getUserMedia lifecycle + frame capture
    useDiagnosisLoop.ts      capture every ~1.5 s, POST, halt on red
    storage.ts               localStorage (onboarding flag, last diagnosis, history)
    links.ts                 constructed retailer / pro-finder URLs
```

### Camera notes

- Requests the back camera with `facingMode: { ideal: "environment" }`; the `<video>` is `playsInline` + `muted` so iOS renders it inline.
- The stream is released when the page is hidden and reacquired when visible; if the OS ends the track (sleep, another app takes the camera) it restarts automatically.
- Frames are downscaled to 640 px wide JPEG before upload. Requests never overlap — the next capture waits for the previous response.

## Swapping in a real vision model

1. Add a provider in `src/lib/diagnosis/` with the signature `(req: DiagnoseRequest) => Promise<Diagnosis>` — send `req.image` to the model, ask for JSON matching `Diagnosis`, validate, return.
2. Register it in `providers` in `src/lib/diagnosis/index.ts`.
3. Set `FIXRAY_DIAGNOSIS_PROVIDER=<name>` (and the model API key) in `.env.local`.

The route handler, client loop and overlay don't change. Regions must be normalized to the captured frame; the overlay handles the `object-cover` crop.

## Deferred (per spec)

Desktop dashboard · database / cross-device history · auth · PWA manifest and Add to Home Screen · mode choice (live vs. snapshot) screen · in-app licensed-pro finder · real retailer pricing.
