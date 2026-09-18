"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Diagnosis, Direction, Region } from "@/lib/diagnosis/types";

const MINT = "#4FC4A8";
const RED = "#E2574A";
const PANEL = "rgba(22,23,24,0.9)";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** null = still looking: draw the scanning reticle. */
  diagnosis: Diagnosis | null;
};

/**
 * Canvas on top of the <video>. Diagnosis regions are in normalized frame coordinates, so they're
 * mapped through the same "object-cover" crop the video uses. Draws on every animation frame so the
 * dashed arrow animates and the highlight glides between polls instead of jumping.
 */
export function OverlayCanvas({ videoRef, diagnosis }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(diagnosis);
  const shown = useRef<Region | null>(null);

  useEffect(() => {
    latest.current = diagnosis;
    if (!diagnosis) shown.current = null;
  }, [diagnosis]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const sans = styles.getPropertyValue("--font-geist-sans").trim() || "system-ui";
    const mono = styles.getPropertyValue("--font-geist-mono").trim() || "monospace";

    let raf = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const d = latest.current;
      if (!d) {
        drawReticle(ctx, W, H, t);
        return;
      }

      // Ease the displayed region toward the latest one.
      const target = d.overlay.region;
      const cur = shown.current ?? target;
      const k = 0.18;
      shown.current = {
        x: cur.x + (target.x - cur.x) * k,
        y: cur.y + (target.y - cur.y) * k,
        w: cur.w + (target.w - cur.w) * k,
        h: cur.h + (target.h - cur.h) * k,
      };

      const rect = toScreen(shown.current, videoRef.current, W, H);
      const color = d.safety.level === "red" ? RED : MINT;

      if (d.overlay.shape === "ring") drawRing(ctx, rect, color);
      else drawBox(ctx, rect, color);
      if (d.overlay.arrow) drawArrow(ctx, rect, d.overlay.arrow, color, t);
      drawCallout(ctx, rect, d.overlay.callout, color, W, H, sans, mono);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}

type Rect = { x: number; y: number; w: number; h: number };

/** Normalized frame coords → CSS pixels, matching `object-fit: cover`. */
function toScreen(r: Region, video: HTMLVideoElement | null, W: number, H: number): Rect {
  const vw = video?.videoWidth || W;
  const vh = video?.videoHeight || H;
  const s = Math.max(W / vw, H / vh);
  const ox = (W - vw * s) / 2;
  const oy = (H - vh * s) / 2;
  return { x: ox + r.x * vw * s, y: oy + r.y * vh * s, w: r.w * vw * s, h: r.h * vh * s };
}

function drawReticle(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const w = Math.min(W * 0.62, 280);
  const h = Math.min(H * 0.42, 360);
  const x = (W - w) / 2;
  const y = H * 0.14;
  const arm = 30;

  ctx.strokeStyle = MINT;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ]) {
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
  }
  ctx.stroke();

  // Pulse, same rhythm as the design's fxPulse (1.8s).
  const p = (t % 1800) / 1800;
  const grow = 8 + p * 18;
  ctx.globalAlpha = 0.8 * (1 - p);
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - grow, y - grow, w + grow * 2, h + grow * 2, 10);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRing(ctx: CanvasRenderingContext2D, r: Rect, color: string) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const radius = Math.max(r.w, r.h) / 2;
  ctx.save();
  ctx.shadowColor = hexA(color, 0.35);
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = hexA(color, 0.14);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawBox(ctx: CanvasRenderingContext2D, r: Rect, color: string) {
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fillStyle = hexA(color, 0.2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  const o = 8;
  const arm = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of [
    [r.x - o, r.y - o, 1, 1],
    [r.x + r.w + o, r.y - o, -1, 1],
    [r.x - o, r.y + r.h + o, 1, -1],
    [r.x + r.w + o, r.y + r.h + o, -1, -1],
  ]) {
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
  }
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, r: Rect, dir: Direction, color: string, t: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -((t / 1600) * 44) % 44; // design's fxDash: 44px per 1.6s

  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  let tip: { x: number; y: number; angle: number };

  if (dir === "cw" || dir === "ccw") {
    // Open arc over the top of the part, arrowhead at the end the motion heads to.
    const radius = Math.max(r.w, r.h) / 2 + 22;
    const a0 = Math.PI * 0.8;
    const a1 = Math.PI * 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.stroke();
    const end = dir === "cw" ? a1 : a0;
    const tangent = dir === "cw" ? end + Math.PI / 2 : end - Math.PI / 2;
    tip = { x: cx + Math.cos(end) * radius, y: cy + Math.sin(end) * radius, angle: tangent };
  } else {
    const len = 70;
    const gap = 18;
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    // Starts at the region edge and points the way the part should move.
    const sx = cx + v[0] * (r.w / 2 + gap);
    const sy = cy + v[1] * (r.h / 2 + gap);
    const ex = sx + v[0] * len;
    const ey = sy + v[1] * len;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    tip = { x: ex, y: ey, angle: Math.atan2(v[1], v[0]) };
  }

  ctx.setLineDash([]);
  ctx.translate(tip.x, tip.y);
  ctx.rotate(tip.angle);
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCallout(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  callout: { title: string; detail: string },
  color: string,
  W: number,
  H: number,
  sans: string,
  mono: string,
) {
  const padX = 16;
  const titleFont = `600 15px ${sans}`;
  const detailFont = `400 12.5px ${mono}`;
  ctx.font = titleFont;
  const tw = ctx.measureText(callout.title).width;
  ctx.font = detailFont;
  const dw = ctx.measureText(callout.detail).width;
  const bw = Math.min(Math.max(tw, dw) + padX * 2, W - 24);
  const bh = 58;

  // Prefer up-and-right of the part, flip left if it would clip, keep on screen.
  const margin = 12;
  let bx = r.x + r.w * 0.6;
  if (bx + bw > W - margin) bx = r.x + r.w * 0.4 - bw;
  bx = clamp(bx, margin, W - bw - margin);
  const top = Math.min(130, H * 0.4); // keep clear of the header and its controls
  let by = r.y - bh - 44;
  if (by < top) by = r.y + r.h + 44;
  by = clamp(by, top, H - bh - margin);

  // Leader line from the callout's nearest edge to the region edge.
  const fromX = clamp(r.x + r.w / 2, bx + 14, bx + bw - 14);
  const fromY = by > r.y ? by : by + bh;
  const toX = r.x + r.w / 2;
  const toY = by > r.y ? r.y + r.h : r.y;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(toX, toY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  roundRect(ctx, bx, by, bw, bh, 14);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#F2F0EB";
  ctx.font = titleFont;
  ctx.fillText(callout.title, bx + padX, by + 25, bw - padX * 2);
  ctx.fillStyle = color;
  ctx.font = detailFont;
  ctx.fillText(callout.detail, bx + padX, by + 45, bw - padX * 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
