import OpenAI from "openai";
import { routeIntentSystemPrompt } from "@/lib/ai/prompts/routeIntentSystemPrompt";
import { routeIntentInputSchema, routeIntentResultSchema, type RouteIntentInput } from "@/lib/ai/routeIntentSchema";

export async function classifyWithOpenAI(input: RouteIntentInput) {
  const parsedInput = routeIntentInputSchema.parse(input);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ok: false as const,
      status: 503,
      error: "OPENAI_API_KEY is not configured."
    };
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_ROUTE_INTENT_MODEL ?? "gpt-4.1-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: routeIntentSystemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            raw_text: parsedInput.raw_text,
            source: parsedInput.source,
            user_id: parsedInput.user_id ?? null
          })
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return {
        ok: false as const,
        status: 502,
        error: "OpenAI route-intent returned an empty response."
      };
    }

    const json = JSON.parse(content) as unknown;
    const result = routeIntentResultSchema.safeParse(json);

    if (!result.success) {
      return {
        ok: false as const,
        status: 422,
        error: `OpenAI route-intent schema validation failed: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
      };
    }

    return {
      ok: true as const,
      status: 200,
      result: result.data
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 502,
      error: error instanceof Error ? error.message : "OpenAI route-intent failed."
    };
  }
}
