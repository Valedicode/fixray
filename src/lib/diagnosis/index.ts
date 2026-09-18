import { diagnoseMock } from "./mock";
import type { DiagnoseRequest, Diagnosis } from "./types";

// Swap point for the real vision model. Add e.g. `claude: diagnoseClaude` that sends
// req.image to a multimodal model and parses its JSON into a Diagnosis, then set
// FIXRAY_DIAGNOSIS_PROVIDER=claude. The route handler and the client don't change.
const providers: Record<string, (req: DiagnoseRequest) => Promise<Diagnosis>> = {
  mock: diagnoseMock,
};

export const providerName = process.env.FIXRAY_DIAGNOSIS_PROVIDER ?? "mock";

export function diagnose(req: DiagnoseRequest): Promise<Diagnosis> {
  const provider = providers[providerName];
  if (!provider) throw new Error(`Unknown diagnosis provider "${providerName}"`);
  return provider(req);
}
