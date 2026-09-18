import { diagnose, providerName } from "@/lib/diagnosis";
import type { DiagnoseRequest, DiagnoseResponse } from "@/lib/diagnosis/types";

const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB JPEG; client sends ~640px frames, far below this
const LEVELS = ["green", "amber", "red"];

export async function POST(request: Request) {
  let body: Partial<DiagnoseRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const { image, mock } = body;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return Response.json({ error: "`image` must be an image data URL" }, { status: 400 });
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return Response.json({ error: "Image too large" }, { status: 413 });
  }
  if (mock !== undefined && !LEVELS.includes(mock)) {
    return Response.json({ error: "`mock` must be green, amber or red" }, { status: 400 });
  }

  const started = Date.now();
  try {
    const diagnosis = await diagnose({ image, mock });
    return Response.json({ diagnosis, provider: providerName, ms: Date.now() - started } satisfies DiagnoseResponse);
  } catch (err) {
    console.error("diagnose failed", err);
    return Response.json({ error: "Diagnosis failed" }, { status: 502 });
  }
}
