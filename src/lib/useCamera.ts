"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type CameraStatus = "starting" | "live" | "denied" | "insecure" | "unavailable" | "error";

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
};

/**
 * Owns the back-camera stream for a <video>. The stream is released while the page is hidden
 * and reacquired when it's visible again, and restarted if the OS kills the track (device sleep,
 * another app taking the camera, iOS interruptions) — so a frozen feed recovers without a reload.
 */
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CameraStatus>("starting");
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0); // bumps on every start/stop so stale getUserMedia results are discarded
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const restart = useRef<() => void>(() => {}); // lets a track's "ended" handler call the latest start()

  const stop = useCallback(() => {
    generation.current++;
    clearTimeout(retryTimer.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  const start = useCallback(async () => {
    stop();
    const gen = generation.current;

    let stream: MediaStream;
    try {
      // mediaDevices is undefined outside a secure context (e.g. a phone hitting the dev server over LAN HTTP).
      stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    } catch (err) {
      if (gen !== generation.current) return;
      if (!navigator.mediaDevices) {
        setStatus(window.isSecureContext ? "unavailable" : "insecure");
        return;
      }
      const name = err instanceof DOMException ? err.name : "";
      setStatus(name === "NotAllowedError" ? "denied" : name === "NotFoundError" ? "unavailable" : "error");
      return;
    }

    if (gen !== generation.current) {
      stream.getTracks().forEach((t) => t.stop()); // a newer start/stop won the race
      return;
    }
    streamRef.current = stream;

    const [track] = stream.getVideoTracks();
    track.addEventListener("ended", () => {
      if (gen !== generation.current || document.hidden) return;
      setStatus("starting");
      retryTimer.current = setTimeout(() => restart.current(), 500);
    });
    // iOS mutes the track during interruptions (calls, Control Center) and can leave the video paused.
    track.addEventListener("unmute", () => videoRef.current?.play().catch(() => {}));

    const video = videoRef.current;
    if (!video) return;
    // Set as properties too: React doesn't reliably reflect `muted`, and iOS only autoplays inline when both hold.
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay of a muted, inline video is allowed; a rejection here is usually a superseded play() call.
    }
    if (gen === generation.current) setStatus("live");
  }, [stop, videoRef]);

  useEffect(() => {
    restart.current = () => void start();
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        setStatus("starting"); // pauses the diagnosis loop until the stream is back
      } else void start();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void start(); // restored from back/forward cache
    };

    // start() only sets state after awaiting getUserMedia, so this subscribes to an external system rather than cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("pageshow", onPageShow);
      stop();
    };
  }, [start, stop]);

  const retry = useCallback(() => {
    setStatus("starting");
    void start();
  }, [start]);

  return { status, retry };
}

/** Grabs the current video frame as a JPEG data URL, downscaled — the model doesn't need full resolution. */
export function captureFrame(video: HTMLVideoElement, maxWidth = 640, quality = 0.7): string | null {
  const { videoWidth: w, videoHeight: h } = video;
  if (!w || !h) return null;
  const scale = Math.min(1, maxWidth / w);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
