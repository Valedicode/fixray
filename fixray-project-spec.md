# fixray — Workflow & Technical Stack Proposal

AR repair assistant. Kevin, September 2026.

## 1. What this is (recap)

Point your phone camera at something broken (faucet, dishwasher gasket, breaker panel) and get a highlighted region + a next-step instruction overlaid on the live camera feed — not a chatbot, not a static photo-diagnosis app. Targets the high-anxiety repair categories (plumbing, electrical, appliances) that competitors avoid, with a first-class green/amber/red safety-classification layer as the trust anchor. A desktop dashboard (repair history, saved appliances, parts/orders, account) is a secondary, later surface.

## 2. Workflow — design and build order

Design and build follow the same order, for the same reason: the mobile flow is where the product's actual identity and technical risk live; the desktop dashboard is downstream of it and has nothing to show until the mobile flow produces real diagnoses.

1. **Design the mobile flow first** (Claude Design, high reasoning effort) — home screen → camera launch/detection → mode choice (live interactive vs. snapshot) → live overlay screen with safety indicator → solution screen → parts links. Established as its own visual system (calm, technical, safety-color language), not a generic AI-app look.
2. **Design the desktop dashboard second**, explicitly referencing the mobile system so it inherits the same palette/type/safety-color treatment rather than diverging.
3. **Build the mobile PWA core flow first**: camera capture → backend diagnosis call → overlay render → safety flag → solution → parts link. This is the part that validates whether the concept is actually useful.
4. **Test on your own iPhone** as soon as the camera + one diagnosis round-trip works — via a Cloudflare Tunnel to your local dev server (HTTPS required for camera access; a plain LAN IP over HTTP won't get camera permission on iOS Safari).
5. **Build the desktop dashboard only once the mobile flow is producing real data** to show — building it earlier just gives you an empty shell.
6. **PWA installability** (manifest + Apple meta tags for "Add to Home Screen") is a later polish step once the core interaction feels right, not a day-one requirement.
7. **Native (Swift/SwiftUI + ARKit)** is a deliberate future phase, not a v1 requirement — see §4.

## 3. Technical stack (v1)

Deliberately lighter than a multi-service backend — no FastAPI, no LangGraph, no MCP, no vector DB. Those solve problems fixray doesn't have yet (multi-tool agent orchestration); fixray's v1 problem is narrow: camera in, diagnosis out.

| Layer | Choice | Why |
|---|---|---|
| Package manager | pnpm | consistent with your other projects |
| Framework | Next.js (App Router) | camera UI, overlay screens, and backend logic in one app |
| Styling | Tailwind CSS | fast to build the camera/overlay/safety-flag screens |
| Camera | Native `MediaDevices.getUserMedia` + `<canvas>` overlay | no library needed; must use `playsInline` + `facingMode: 'environment'` for iOS Safari to render inline rather than hijacking fullscreen |
| Backend logic | Next.js Route Handlers | a single endpoint takes a captured frame, returns a diagnosis — no separate service needed yet |
| Diagnosis/vision | Multimodal LLM API call (e.g. Claude vision) from that route handler, on a periodic capture (~1–2s), not continuous on-device detection | proves the concept fast; true real-time on-device detection (TF.js/ONNX Web) is fragile on iOS Safari and is a project of its own — defer it |
| Dev testing on iOS | Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`) | gives HTTPS + keeps hot reload; camera access requires a secure context, which a LAN IP over HTTP does not satisfy |
| Auth | None for v1 | single-person / small-group testing doesn't need accounts; add real auth (Supabase Auth/NextAuth) only once testers beyond a handful need separate persistent identities |
| Access control | Optional simple password-gate middleware if deployed to a public Vercel URL | an unlisted URL isn't truly private; a few lines of middleware is enough for friends-testing, not production-grade and not meant to be |
| State/persistence | In-memory or `localStorage` for now | no database needed until the desktop dashboard needs cross-device history; adding Supabase/Postgres is the trigger point for that, not day one |
| Hosting (past local testing) | Vercel | zero-config HTTPS, trivial previews, native Next.js support; can replace the tunnel once you want to share a link instead of testing locally |
| PWA installability | `manifest.json` + `apple-mobile-web-app-capable` / `apple-touch-icon` meta tags | later step, once the core flow is validated |
| Parts links | Plain constructed outbound links (e.g. an Amazon search URL) | a real Product Advertising API integration is separate later setup — don't block the MVP on it |

## 4. When to graduate to native (Swift/ARKit)

Not a v1 requirement, but the concrete triggers to watch for:
- You want the overlay arrow to stay **anchored in 3D space** as the camera moves (true AR world-tracking) — this needs ARKit; it isn't available through a browser, and Safari doesn't support WebXR's AR module at all.
- You want tighter camera control than `getUserMedia` allows (manual focus/exposure/frame-rate via AVFoundation).
- You want real App Store distribution.

When that point comes, React Native + Expo is the more natural next step than a from-scratch Swift rewrite — it carries forward more of the existing React component/logic work. A native app also requires an Apple Developer account ($99/year) to install on your own physical iPhone beyond a 7-day trial provisioning — the web/PWA route needs no Apple account at all, which is part of why it's the right v1 choice.

## 5. Open items to decide once building starts

- Exact vision-API provider/model for the diagnosis call, and a rough cost-per-scan check once real usage starts.
- Whether snapshot mode and live-interactive mode share one backend endpoint or two.
- The exact safety-classification rules (what specifically triggers amber vs. red) — needs a real content pass, not just "electrical/gas = red" as a placeholder.
