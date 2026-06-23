import { NextRequest, NextResponse } from "next/server";
import { classifyWithOpenAI } from "@/lib/ai/openaiRouteIntent";
import { mockRouteIntentStructured, routeIntentInputSchema } from "@/lib/ai/routeIntentSchema";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function isActiveOwner(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return false;
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const profile = await adminDb.collection("users").doc(decoded.uid).get();
  const data = profile.data();

  return data?.role === "owner" && data?.status === "active";
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isActiveOwner(request))) {
      return NextResponse.json({ ok: false, error: "Owner access required." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = routeIntentInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid route-intent input." }, { status: 400 });
    }

    const mode = process.env.NEXT_PUBLIC_AI_ROUTE_MODE ?? "mock";

    if (mode === "mock") {
      return NextResponse.json({
        ok: true,
        mode: "mock",
        result: mockRouteIntentStructured(parsed.data.raw_text)
      });
    }

    const openAiResult = await classifyWithOpenAI(parsed.data);

    if (openAiResult.ok) {
      return NextResponse.json({
        ok: true,
        mode: "openai",
        result: openAiResult.result
      });
    }

    if (mode === "fallback") {
      return NextResponse.json({
        ok: true,
        mode: "fallback",
        warning: openAiResult.error,
        result: mockRouteIntentStructured(parsed.data.raw_text)
      });
    }

    return NextResponse.json(
      {
        ok: false,
        mode: "openai",
        error: openAiResult.error
      },
      { status: openAiResult.status }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Route-intent request failed." }, { status: 500 });
  }
}
