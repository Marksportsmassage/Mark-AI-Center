import {
  mockRouteIntentStructured,
  routeIntentResultSchema,
  type AiRouteMode,
  type RouteIntentInput,
  type RouteIntentResult
} from "@/lib/ai/routeIntentSchema";

export interface RouteIntentModeResult {
  ok: boolean;
  mode: AiRouteMode;
  result: RouteIntentResult | null;
  error?: string;
  validationFailed?: boolean;
}

export async function resolveRouteIntentMode(
  input: RouteIntentInput,
  mode: AiRouteMode,
  classifyOpenAI: (input: RouteIntentInput) => Promise<{ ok: true; result: unknown } | { ok: false; error: string }>
): Promise<RouteIntentModeResult> {
  if (mode === "mock") return { ok: true, mode: "mock", result: mockRouteIntentStructured(input.raw_text) };
  const openAiResult = await classifyOpenAI(input);
  if (openAiResult.ok) {
    const parsed = routeIntentResultSchema.safeParse(openAiResult.result);
    if (!parsed.success) {
      return { ok: false, mode: "openai", result: null, error: "schema validation failed", validationFailed: true };
    }
    return { ok: true, mode: "openai", result: parsed.data };
  }
  if (mode === "fallback") return { ok: true, mode: "fallback", result: mockRouteIntentStructured(input.raw_text), error: openAiResult.error };
  return { ok: false, mode: "openai", result: null, error: openAiResult.error };
}
