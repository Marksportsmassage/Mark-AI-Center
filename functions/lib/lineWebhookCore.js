"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashValue = hashValue;
exports.verifyLineSignature = verifyLineSignature;
exports.processLineWebhook = processLineWebhook;
const node_crypto_1 = require("node:crypto");
function nowIso(input) {
    return input ?? new Date().toISOString();
}
function hashValue(value) {
    return (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
}
function last4(value) {
    return value.slice(-4);
}
function redactErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error ?? "unknown error");
    return message.replace(/sk-[A-Za-z0-9_-]+/g, "sk-redacted").slice(0, 240);
}
function eventShapeSummary(body) {
    const parsedBody = body && typeof body === "object" ? body : {};
    const events = Array.isArray(parsedBody.events) ? parsedBody.events : [];
    const firstEvent = events[0] && typeof events[0] === "object" ? events[0] : {};
    const source = firstEvent.source && typeof firstEvent.source === "object" ? firstEvent.source : {};
    const message = firstEvent.message && typeof firstEvent.message === "object" ? firstEvent.message : {};
    const messageType = typeof message.type === "string" ? message.type : null;
    return {
        error_code: null,
        error_message_redacted: null,
        event_shape_summary: events.length === 0 ? "no_events" : `events:${events.length}`,
        has_events: events.length > 0,
        event_count: events.length,
        has_user_id: typeof source.userId === "string" && source.userId.length > 0,
        message_type: messageType
    };
}
function response(status, body, log) {
    return { status, body, log };
}
function lineReplyMode(enabled) {
    return enabled === true ? "enabled_ack_only" : "disabled";
}
function processedAckMessage(needsClarification) {
    return needsClarification
        ? "已收到，但我需要 Mark 補充分類。請到 Mark AI Command Center 查看需要確認的項目。"
        : "已收到，已整理到 Mark AI Command Center，請到後台確認。";
}
async function writeReplyAudit(store, input) {
    await store.createAuditLog({
        user_id: "system_line_mark",
        action: input.action,
        target_collection: "line_events",
        target_id: input.lineEventId,
        before: null,
        after: { reply_status: input.replyStatus },
        reason: input.reason,
        created_at: input.now,
        updated_at: input.now
    });
}
async function handleAckReply(input) {
    if (!input.enabled) {
        await input.store.updateLineEvent(input.lineEventId, {
            reply_sent: false,
            reply_status: "not_enabled",
            reply_mode: "disabled",
            updated_at: input.now
        });
        await writeReplyAudit(input.store, {
            action: "line_reply_skipped",
            lineEventId: input.lineEventId,
            reason: "LINE_REPLY_ENABLED=false",
            now: input.now,
            replyStatus: "not_enabled"
        });
        return false;
    }
    if (!input.accessToken) {
        await input.store.updateLineEvent(input.lineEventId, {
            reply_sent: false,
            reply_status: "skipped_missing_token",
            reply_mode: "enabled_ack_only",
            reply_warning_redacted: "LINE reply skipped because access token is missing.",
            updated_at: input.now
        });
        await writeReplyAudit(input.store, {
            action: "line_reply_skipped_missing_token",
            lineEventId: input.lineEventId,
            reason: "LINE_REPLY_ENABLED=true but LINE_CHANNEL_ACCESS_TOKEN is missing",
            now: input.now,
            replyStatus: "skipped_missing_token"
        });
        return false;
    }
    if (!input.replyToken || !input.replyClient) {
        await input.store.updateLineEvent(input.lineEventId, {
            reply_sent: false,
            reply_status: "skipped_error",
            reply_mode: "enabled_ack_only",
            reply_warning_redacted: "LINE reply skipped because reply helper or reply token is missing.",
            updated_at: input.now
        });
        return false;
    }
    try {
        await input.replyClient.reply({
            replyToken: input.replyToken,
            accessToken: input.accessToken,
            message: processedAckMessage(input.needsClarification)
        });
        await input.store.updateLineEvent(input.lineEventId, {
            reply_sent: true,
            reply_status: "sent",
            reply_mode: "enabled_ack_only",
            updated_at: input.now
        });
        await writeReplyAudit(input.store, {
            action: "line_reply_sent",
            lineEventId: input.lineEventId,
            reason: "LINE reply enabled and message processed successfully",
            now: input.now,
            replyStatus: "sent"
        });
        return true;
    }
    catch (error) {
        await input.store.updateLineEvent(input.lineEventId, {
            reply_sent: false,
            reply_status: "skipped_error",
            reply_mode: "enabled_ack_only",
            reply_error_redacted: redactErrorMessage(error),
            updated_at: input.now
        });
        return false;
    }
}
function verifyLineSignature(rawBody, signature, channelSecret) {
    if (!channelSecret || !signature) {
        return false;
    }
    const digest = (0, node_crypto_1.createHmac)("sha256", channelSecret).update(rawBody).digest("base64");
    const expected = Buffer.from(digest);
    const actual = Buffer.from(signature);
    return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
function redactLineEvent(event, userId) {
    const message = event.message && typeof event.message === "object" ? event.message : {};
    return {
        type: event.type,
        webhookEventId: event.webhookEventId,
        timestamp: event.timestamp,
        source: {
            type: event.source && typeof event.source === "object"
                ? event.source.type
                : undefined,
            line_user_id_hash: userId ? hashValue(userId) : undefined,
            line_user_id_last4: userId ? last4(userId) : undefined
        },
        message: {
            type: message.type,
            text_length: typeof message.text === "string" ? message.text.length : undefined
        }
    };
}
function mockLineRoute(rawText) {
    const lower = rawText.toLowerCase();
    const includes = (items) => items.some((item) => lower.includes(item.toLowerCase()));
    const isBusinessEvaluationQuestion = includes([
        "評估",
        "成本",
        "資金",
        "可行",
        "損益",
        "回本",
        "毛利",
        "投入",
        "預算",
        "測試",
        "風險",
        "創業"
    ]);
    if (includes(["服飾", "選品", "測試資金", "初期資金", "初期投入", "批發", "進貨", "庫存", "毛利", "回本"]) &&
        isBusinessEvaluationQuestion) {
        return {
            detected_intent: "business_startup_analysis",
            project_id: "apparel_business",
            agent_ids: [
                "market_intelligence_ai",
                "business_model_ai",
                "cfo_ai",
                "risk_officer_ai",
                "supply_chain_ai",
                "growth_marketing_ai"
            ],
            confidence: 0.9,
            needs_clarification: false,
            summary: "根據輸入整理，重點是評估服飾選品創業的初期測試資金、成本、風險與小額驗證方式。",
            task_type: "startup_capital_analysis",
            stage: "research",
            codex_needed: false,
            priority: "high",
            task_needed: true,
            task_dispatch: {
                title: "評估服飾選品創業初期測試資金",
                background: "Mark 想評估服飾選品創業，重點是初期測試資金、成本結構、庫存風險與小額驗證。",
                instructions: [
                    "估算服飾選品初期測試資金範圍",
                    "拆解進貨、拍攝、上架、廣告、包材與退換貨成本",
                    "評估小額測試方案，避免一開始大量壓庫存",
                    "提出停損條件與是否值得進入下一階段"
                ],
                completion_standard: "產出一份可供 Mark 審核的服飾選品小額測試資金與風險評估。",
                report_format: "用表格列出成本、預算範圍、風險、測試方式、是否建議執行。"
            },
            business_decision: {
                capital_required: null,
                expected_roi: null,
                payback_period: null,
                risk_level: "medium",
                cashflow_impact: "需要評估是否動用創業測試預算，不可影響安全現金水位。"
            },
            safety_forbidden_reasons: ["不得自動進貨", "不得自動付款", "不得自動對外聯繫供應商", "不得承諾獲利"]
        };
    }
    if (includes(["一番賞", "公仔"]) && isBusinessEvaluationQuestion) {
        return {
            detected_intent: "ichiban_kuji_startup",
            project_id: "ichiban_kuji_business",
            agent_ids: ["market_intelligence_ai", "business_model_ai", "risk_officer_ai", "cfo_ai", "operations_sop_ai"],
            confidence: 0.88,
            needs_clarification: false,
            summary: "一番賞 / 公仔抽賞創業評估輸入，需要市場、商模、風險、財務與營運 SOP 研究。",
            task_type: "startup",
            stage: "research",
            codex_needed: false,
            priority: "high",
            task_needed: true
        };
    }
    if (includes(["飲料店"]) && isBusinessEvaluationQuestion) {
        return {
            detected_intent: "beverage_startup",
            project_id: "beverage_business",
            agent_ids: ["market_intelligence_ai", "business_model_ai", "risk_officer_ai", "cfo_ai", "operations_sop_ai", "growth_marketing_ai"],
            confidence: 0.88,
            needs_clarification: false,
            summary: "飲料店創業評估輸入，需要商圈、商模、風險、財務、SOP 與行銷研究。",
            task_type: "startup",
            stage: "research",
            codex_needed: false,
            priority: "high",
            task_needed: true
        };
    }
    if (includes(["資金複利", "資金配置"]) || (includes(["資金"]) && includes(["股票", "創業", "配置"]))) {
        return {
            detected_intent: "capital_allocation_decision",
            project_id: "capital_compounding",
            agent_ids: ["cfo_ai", "capital_allocation_ai", "investment_ai", "risk_officer_ai"],
            confidence: 0.88,
            needs_clarification: false,
            summary: "資金複利 / 資金配置相關輸入，需要比較股票、創業測試與現金水位風險。",
            task_type: "capital_allocation",
            stage: "research",
            codex_needed: false,
            priority: "high",
            task_needed: true
        };
    }
    if (includes(["codex", "開發", "app", "功能"])) {
        return {
            detected_intent: "app_development",
            project_id: "body_state_app",
            agent_ids: ["product_ai", "project_manager_ai"],
            confidence: 0.86,
            needs_clarification: false,
            summary: "LINE 輸入被分類為 App / Codex / 功能開發任務。",
            task_type: "app_development",
            stage: "idea",
            codex_needed: true,
            priority: "medium",
            task_needed: true
        };
    }
    return {
        detected_intent: "needs_clarification",
        project_id: "core_operations",
        agent_ids: ["chief_ai", "project_manager_ai"],
        confidence: 0.35,
        needs_clarification: true,
        clarification_question: "這件事比較接近哪一類：個人待辦、App 開發、學員課表、考試整理、投資分析、創業評估、品牌內容？",
        summary: "LINE 輸入需要 Mark 補充分類。",
        task_type: "clarification",
        stage: "research",
        codex_needed: false,
        priority: "medium",
        task_needed: false
    };
}
async function processLineWebhook(request) {
    const now = nowIso(request.now);
    const replyEnabled = request.env.lineReplyEnabled === true;
    const replyMode = lineReplyMode(replyEnabled);
    let replySent = false;
    if (!request.env.lineChannelSecret) {
        return response(500, { ok: false, error: "LINE_CHANNEL_SECRET is not configured." }, {
            error_code: "missing_secret",
            error_message_redacted: "LINE_CHANNEL_SECRET is not configured.",
            event_shape_summary: "not_parsed",
            has_events: false,
            event_count: 0,
            has_user_id: false,
            message_type: null
        });
    }
    if (!verifyLineSignature(request.rawBody, request.signature, request.env.lineChannelSecret)) {
        try {
            await request.store.createLineEvent({
                status: "rejected_invalid_signature",
                signature_verified: false,
                allowed_user: false,
                processed_to_inbox: false,
                message_text_length: 0,
                error_summary_redacted: "Invalid LINE signature.",
                created_at: now,
                updated_at: now
            });
        }
        catch {
            // Intentionally ignored: invalid signatures must not create inbox/tasks, and logging failure should not mask 401.
        }
        return response(401, { ok: false, error: "Invalid LINE signature." }, {
            error_code: "invalid_signature",
            error_message_redacted: "Invalid LINE signature.",
            event_shape_summary: "signature_rejected",
            has_events: false,
            event_count: 0,
            has_user_id: false,
            message_type: null
        });
    }
    let body;
    try {
        body = JSON.parse(request.rawBody.toString("utf8"));
    }
    catch {
        return response(200, { ok: true, processed: 0, ignored: true, reason: "invalid_json", reply_sent: false }, {
            error_code: "invalid_json",
            error_message_redacted: "Invalid JSON body.",
            event_shape_summary: "invalid_json",
            has_events: false,
            event_count: 0,
            has_user_id: false,
            message_type: null
        });
    }
    const log = eventShapeSummary(body);
    const events = Array.isArray(body.events) ? body.events : [];
    if (events.length === 0) {
        return response(200, { ok: true, processed: 0, ignored: true, reason: "no_events", reply_sent: false }, log);
    }
    let processed = 0;
    let errors = 0;
    for (const event of events) {
        try {
            const source = event.source && typeof event.source === "object" ? event.source : {};
            const userId = typeof source.userId === "string" ? source.userId : "";
            const userHash = userId ? hashValue(userId) : "unknown";
            const userLast4 = userId ? last4(userId) : "";
            const eventId = typeof event.webhookEventId === "string" ? event.webhookEventId : undefined;
            const replyToken = typeof event.replyToken === "string" ? event.replyToken : undefined;
            const message = event.message && typeof event.message === "object" ? event.message : {};
            const messageType = typeof message.type === "string" ? message.type : "unknown";
            const messageText = typeof message.text === "string" ? message.text : "";
            if (eventId) {
                const existingEvent = await request.store.getLineEvent(eventId);
                if (existingEvent) {
                    await request.store.updateLineEvent(eventId, {
                        duplicate_ignored: true,
                        duplicate_seen_at: now,
                        status: "duplicate_ignored",
                        reply_status: "duplicate_ignored",
                        updated_at: now
                    });
                    continue;
                }
            }
            if (!userId) {
                await request.store.createLineEvent({
                    id: eventId,
                    event_id: eventId,
                    source_type: source.type ?? "unknown",
                    line_user_id_hash: null,
                    line_user_id_last4: null,
                    raw_event_redacted: redactLineEvent(event),
                    message_type: messageType,
                    message_text: null,
                    message_text_length: messageText.length,
                    signature_verified: true,
                    allowed_user: false,
                    processed_to_inbox: false,
                    status: "waiting_owner_link",
                    reply_sent: false,
                    reply_status: "skipped_unauthorized",
                    reply_mode: replyMode,
                    error_summary_redacted: "Missing source.userId.",
                    created_at: now,
                    updated_at: now
                }, eventId);
                continue;
            }
            const lineUser = await request.store.getLineUser(userHash);
            const allowed = lineUser?.status === "allowed";
            if (!allowed) {
                await request.store.upsertLineUser(userHash, {
                    line_user_id_hash: userHash,
                    line_user_id_last4: userLast4,
                    status: lineUser?.status ?? "pending",
                    created_at: lineUser?.first_seen_at ?? now,
                    updated_at: now,
                    first_seen_at: lineUser?.first_seen_at ?? now,
                    last_seen_at: now,
                    event_count: (lineUser?.event_count ?? 0) + 1,
                    approved: false
                });
                await request.store.createLineEvent({
                    id: eventId,
                    event_id: eventId,
                    source_type: source.type ?? "user",
                    line_user_id_hash: userHash,
                    line_user_id_last4: userLast4,
                    raw_event_redacted: redactLineEvent(event, userId),
                    message_type: messageType,
                    message_text: messageType === "text" ? messageText : null,
                    message_text_length: messageText.length,
                    signature_verified: true,
                    allowed_user: false,
                    processed_to_inbox: false,
                    status: "waiting_owner_link",
                    reply_sent: false,
                    reply_status: "skipped_unauthorized",
                    reply_mode: replyMode,
                    created_at: now,
                    updated_at: now
                }, eventId);
                continue;
            }
            const lineEventId = await request.store.createLineEvent({
                id: eventId,
                event_id: eventId,
                source_type: source.type ?? "user",
                line_user_id_hash: userHash,
                line_user_id_last4: userLast4,
                raw_event_redacted: redactLineEvent(event, userId),
                message_type: messageType,
                message_text: messageType === "text" ? messageText : null,
                message_text_length: messageText.length,
                signature_verified: true,
                allowed_user: true,
                processed_to_inbox: false,
                status: messageType === "text" ? "received" : "unsupported_message_type",
                reply_sent: false,
                reply_status: messageType === "text" ? "not_enabled" : "skipped_non_text",
                reply_mode: replyMode,
                created_at: now,
                updated_at: now
            }, eventId);
            if (messageType !== "text") {
                await request.store.updateLineEvent(lineEventId, {
                    reply_sent: false,
                    reply_status: "skipped_non_text",
                    updated_at: now
                });
                continue;
            }
            const route = mockLineRoute(messageText);
            const inboxId = await request.store.createInbox({
                user_id: "system_line_mark",
                source: "line",
                title: messageText.slice(0, 48),
                body: messageText,
                raw_text: messageText,
                normalized_text: messageText,
                detected_intent: route.detected_intent,
                project_id: route.project_id,
                related_project_id: route.project_id,
                agent_ids: route.agent_ids,
                confidence: route.confidence,
                needs_clarification: route.needs_clarification,
                clarification_question: route.clarification_question ?? null,
                summary: route.summary,
                priority: route.priority,
                status: route.needs_clarification ? "waiting_clarification" : route.task_needed ? "converted_to_task" : "triaged",
                need_mark_review: true,
                review_status: "pending",
                ai_mode: "mock",
                created_at: now,
                updated_at: now
            });
            const routeLogId = await request.store.createRouteLog({
                user_id: "system_line_mark",
                source: "line",
                inbox_id: inboxId,
                mode: "mock",
                status: "success",
                model: "mock",
                latency_ms: 0,
                input_length: messageText.length,
                output_valid: true,
                detected_intent: route.detected_intent,
                project_id: route.project_id,
                agent_ids: route.agent_ids,
                confidence: route.confidence,
                needs_clarification: route.needs_clarification,
                error_code: null,
                error_summary_redacted: null,
                line_reply_enabled: replyEnabled,
                line_reply_status: "not_attempted",
                created_at: now,
                updated_at: now
            });
            let taskId = null;
            if (route.task_needed && !route.needs_clarification) {
                taskId = await request.store.createTaskDispatch({
                    source_inbox_id: inboxId,
                    project_id: route.project_id,
                    related_project_id: route.project_id,
                    agent_ids: route.agent_ids,
                    assigned_agent_id: route.agent_ids[0],
                    title: route.task_dispatch?.title ?? messageText.slice(0, 48),
                    task_type: route.task_type,
                    background: route.task_dispatch?.background ?? messageText,
                    instructions: route.task_dispatch?.instructions?.join("\n") ??
                        "整理 LINE 私人輸入口的內容，輸出待 Mark review 的任務建議。不得回覆 LINE。",
                    instruction: route.task_dispatch?.instructions?.join("\n") ??
                        "整理 LINE 私人輸入口的內容，輸出待 Mark review 的任務建議。不得回覆 LINE。",
                    owner_type: route.task_dispatch ? "ai_agent" : "mark",
                    human_assistant_needed: false,
                    ai_agent_needed: true,
                    codex_needed: route.codex_needed,
                    completion_standard: route.task_dispatch?.completion_standard ?? "提供 Mark 可審核的摘要、風險與下一步。",
                    report_format: route.task_dispatch?.report_format ?? "summary / risks / next_actions / mark_review_required",
                    priority: route.priority,
                    status: "waiting_review",
                    need_mark_review: true,
                    review_status: "pending",
                    capital_required: route.business_decision?.capital_required ?? "none",
                    expected_roi: route.business_decision?.expected_roi ?? "not_estimated",
                    payback_period: route.business_decision?.payback_period ?? "not_applicable",
                    risk_level: route.business_decision?.risk_level ?? "medium",
                    cashflow_impact: route.business_decision?.cashflow_impact ?? "none",
                    stage: route.stage,
                    decision_status: "pending",
                    external_action_allowed: false,
                    safety_forbidden_reasons: route.safety_forbidden_reasons ?? [],
                    ai_mode: "mock",
                    created_at: now,
                    updated_at: now
                });
                await request.store.updateInbox(inboxId, {
                    task_dispatch_id: taskId,
                    route_log_id: routeLogId,
                    updated_at: now
                });
            }
            else {
                await request.store.updateInbox(inboxId, {
                    route_log_id: routeLogId,
                    updated_at: now
                });
            }
            await request.store.updateLineEvent(lineEventId, {
                status: "processed",
                processed_to_inbox: true,
                inbox_id: inboxId,
                route_log_id: routeLogId,
                task_dispatch_id: taskId,
                updated_at: now
            });
            const didReply = await handleAckReply({
                store: request.store,
                replyClient: request.replyClient,
                lineEventId,
                replyToken,
                accessToken: request.env.lineChannelAccessToken,
                enabled: replyEnabled,
                needsClarification: route.needs_clarification,
                now
            });
            replySent = replySent || didReply;
            processed += 1;
        }
        catch (error) {
            errors += 1;
            log.error_code = "event_processing_error";
            log.error_message_redacted = redactErrorMessage(error);
        }
    }
    return response(200, { ok: true, processed, errors, reply_sent: replySent, reply_mode: replyMode }, log);
}
//# sourceMappingURL=lineWebhookCore.js.map