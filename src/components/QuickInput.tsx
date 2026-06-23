"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import {
  mockRouteIntentStructured,
  routeIntentResultSchema,
  type AiRouteMode
} from "@/lib/ai/routeIntentSchema";
import { createQuickInputRecords, type ClassificationResult } from "@/lib/quick-input/createQuickInputRecords";

export function QuickInput({ userId }: { userId: string }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<AiRouteMode>((process.env.NEXT_PUBLIC_AI_ROUTE_MODE as AiRouteMode) ?? "mock");
  const [isSaving, setIsSaving] = useState(false);

  async function classifyInput(rawText: string): Promise<ClassificationResult> {
    const configuredMode = process.env.NEXT_PUBLIC_AI_ROUTE_MODE ?? "mock";
    const startedAt = Date.now();

    if (configuredMode === "mock") {
      return {
        result: mockRouteIntentStructured(rawText),
        mode: "mock",
        latency_ms: Date.now() - startedAt,
        model: "mock"
      };
    }

    try {
      const token = await getClientAuth().currentUser?.getIdToken();
      const response = await fetch("/api/ai/route-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          raw_text: rawText,
          source: "web",
          user_id: userId
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        mode?: AiRouteMode;
        result?: unknown;
        error?: string;
        warning?: string;
      };

      if (payload.ok && payload.result) {
        const parsed = routeIntentResultSchema.safeParse(payload.result);

        if (!parsed.success) {
          return {
            result: null,
            mode: "openai",
            error: "Route-intent schema validation failed.",
            validationFailed: true,
            latency_ms: Date.now() - startedAt,
            error_code: "validation_error"
          };
        }

        return {
          result: parsed.data,
          mode: payload.mode ?? "openai",
          error: payload.warning,
          latency_ms: Date.now() - startedAt,
          model: payload.mode === "fallback" ? "mock" : "openai"
        };
      }

      if (response.status === 422) {
        return {
          result: null,
          mode: "openai",
          error: payload.error ?? "OpenAI route-intent schema validation failed.",
          validationFailed: true,
          latency_ms: Date.now() - startedAt,
          error_code: "validation_error"
        };
      }

      return {
        result: mockRouteIntentStructured(rawText),
        mode: "fallback",
        error: payload.error ?? "OpenAI route-intent failed, fallback mock was used.",
        latency_ms: Date.now() - startedAt,
        model: "mock",
        error_code: response.status === 503 ? "missing_key" : "api_error"
      };
    } catch {
      return {
        result: mockRouteIntentStructured(rawText),
        mode: "fallback",
        error: "OpenAI route-intent failed, fallback mock was used.",
        latency_ms: Date.now() - startedAt,
        model: "mock",
        error_code: "api_error"
      };
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!body.trim()) {
      setStatus("請先輸入內容。");
      return;
    }

    setIsSaving(true);

    try {
      const db = getClientDb();
      const rawText = body.trim();
      const result = await createQuickInputRecords({
        db,
        userId,
        rawText,
        source: "web",
        classify: classifyInput
      });
      setLastMode(result.mode);

      setBody("");
      setStatus(
        result.status === "ai_error"
          ? "AI route-intent schema 驗證失敗，已標記 ai_error，沒有建立 Task Dispatch。"
          : result.status === "waiting_clarification"
          ? "已加入 AI Inbox，等待 Mark 補充分類。"
          : result.taskId
            ? "已加入 AI Inbox 並建立 Task Dispatch，等待 Mark review。"
            : "已加入 AI Inbox，未建立 Task Dispatch。"
      );
    } catch {
      setStatus("尚未連上 Firebase。請確認 .env.local 與登入狀態，或先使用 seed demo data。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel">
      <div className="item-header">
        <h2>Quick Input</h2>
        <span className={`badge ${lastMode === "fallback" ? "review" : ""}`}>
          {lastMode === "openai" ? "ai mode" : lastMode === "fallback" ? "ai error: fallback mock" : "mock mode"}
        </span>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Input</span>
          <textarea
            className="textarea"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="把想法、任務、決策問題、專案更新丟進來。系統會 mock 分類並建立待審核任務，不會執行外部動作。"
          />
        </label>
        <button className="button" type="submit" disabled={isSaving}>
          <Send size={16} />
          {isSaving ? "Saving" : "Add to Inbox"}
        </button>
        {status ? <p className="muted">{status}</p> : null}
      </form>
    </section>
  );
}
