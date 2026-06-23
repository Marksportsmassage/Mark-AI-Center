# Mark AI Center

Personal AI Command Center for Mark.

Phase 1 includes the Next.js app shell, Firebase initialization, Firestore data contracts, a seed script, and Firebase Functions scaffolding. It does not call OpenAI, does not connect LINE credentials, and does not send external messages.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## First owner bootstrap

1. Fill `.env.local` with the Firebase web app config from Firebase Console.
2. Enable a Firebase Auth provider, then sign in at `/login`.
3. After sign-in, the login page displays the current Firebase UID.
4. Bootstrap Mark as the only active owner:

```bash
MARK_OWNER_UID="paste-firebase-uid-here" MARK_OWNER_EMAIL="mark@example.com" npm run bootstrap-owner
```

Or:

```bash
npm run bootstrap-owner -- --uid="paste-firebase-uid-here" --email="mark@example.com"
```

Do not hard-code the UID, credentials, LINE token, or OpenAI key in source code.

## Seed Firestore

Use Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS` locally, then run:

```bash
npm run seed
```

Seed creates the Phase 2 project and agent baseline:

- 15 `projects`
- 17 `ai_agents`
- initial `ai_inbox`
- initial `task_dispatches`
- supporting review-first collections

Every seeded AI-generated object uses `need_mark_review: true`. The seed uses merge writes and does not delete data.

## Firestore rules tests

Rules tests run against the local Firestore emulator and do not touch production data.

```bash
npm run test:rules
```

This starts the Firestore emulator through `firebase emulators:exec` and runs:

```bash
vitest run tests/firestore.rules.test.ts
```

You can also use the alias:

```bash
npm run emulators:test:rules
```

To run emulators manually:

```bash
npx firebase emulators:start --only firestore
```

## Route-intent mode

Quick Input supports three modes through `.env.local`:

```bash
NEXT_PUBLIC_AI_ROUTE_MODE=mock
NEXT_PUBLIC_AI_ROUTE_MODE=openai
NEXT_PUBLIC_AI_ROUTE_MODE=fallback
```

- `mock`: local classifier only.
- `openai`: call `/api/ai/route-intent`; if OpenAI schema validation fails, the inbox item is marked `ai_error` and no task is created.
- `fallback`: call OpenAI first, but safely fallback to mock when the API key is missing or the OpenAI request fails.

OpenAI uses `OPENAI_API_KEY`. Keep it only in `.env.local` or a secure hosting secret store. Never commit it.

Every Quick Input or LINE route-intent run writes a compact `ai_route_logs` record. Logs store metadata such as mode, latency, detected intent, confidence, and redacted error summary. They do not store the full OpenAI prompt, raw API payload, LINE token, or API key.

## Quick Input integration tests

Integration tests use the Firestore emulator and mock route-intent. They do not call production Firestore or OpenAI.

```bash
npm run test:integration
```

## LINE private input, Phase 4A

Phase 4A adds a private LINE webhook capture flow. It validates LINE signatures, records pending candidates, and only lets approved LINE users create `ai_inbox` records.

Required runtime environment variables:

```bash
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_WEBHOOK_MODE=capture_only
NEXT_PUBLIC_LINE_WEBHOOK_MODE=capture_only
LINE_REPLY_ENABLED=false
NEXT_PUBLIC_LINE_REPLY_ENABLED=false
```

`LINE_REPLY_ENABLED` defaults to `false` when unset. `NEXT_PUBLIC_LINE_REPLY_ENABLED` is only a UI mirror for `/settings`; it is not used as an authorization control. Keep `LINE_CHANNEL_ACCESS_TOKEN` in Firebase Functions secrets or secure runtime environment only. Never commit it.

Setup outline:

1. Create a LINE Developers Messaging API channel.
2. Copy the Channel secret into a secure runtime env var as `LINE_CHANNEL_SECRET`.
3. Generate a Channel access token and store it securely as `LINE_CHANNEL_ACCESS_TOKEN`, even though Phase 4A does not use it yet.
4. Deploy Firebase Functions and set the webhook URL to the deployed `lineWebhook` HTTPS URL.
5. Send one test message from Mark's LINE account.
6. Open `/settings`, find the pending LINE candidate, verify last4/hash, then click `Approve as Mark`.
7. Send another text message. If signature is valid and the candidate is approved, it will create `line_events`, `ai_inbox`, `ai_route_logs`, and, when classified, `task_dispatches`.

Security behavior:

- Invalid signatures return 401 and do not create inbox/tasks.
- Missing `LINE_CHANNEL_SECRET` returns a clear error and does not process events.
- Unauthorized LINE users only become pending candidates and do not create inbox/tasks.
- Non-text messages are recorded as unsupported and do not create inbox/tasks.
- Phase 4A sends no LINE reply or push by design.
- Phase 4B can send one ack-only LINE reply when `LINE_REPLY_ENABLED=true`, the signature is valid, the LINE user is approved, the message is text, and inbox/route handling succeeds.
- Phase 4B reply text is only a receipt confirmation. It never sends AI analysis, investment advice, startup conclusions, customer schedule details, or medical/training judgment.
- LINE push remains disabled.

LINE tests do not call the real LINE API and do not call OpenAI:

```bash
npm run test:line
```

## Phase 2 safety model

- Protected pages redirect signed-out users to `/login`.
- Firestore Rules only allow active owner access to core collections.
- Non-owner users do not see data and cannot write data.
- Quick Input writes to `ai_inbox`, then may create a `task_dispatches` item with `decision_status: pending`.
- Review buttons update Firestore status fields and write `audit_logs`. They do not send LINE messages, publish posts, modify customer records, delete data, place trades, or provide medical diagnosis.
