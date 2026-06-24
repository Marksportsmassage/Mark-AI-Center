# Local Validation Required Before Merge / Deploy

Run these commands locally from `/Users/mark/Documents/MSM/mark-ai-center` before merge or deploy:

```bash
npm run build
npm run functions:build
npm run test:line
npm run test:finance
npm run test:decision
npm run test:brief
npm run test:knowledge
npm run test:universe
npm run test:route-intent
npm run test:codex-jobs
npm run test:audit
npm run test:rules
npm run test:integration
```

Notes:

- `test:rules` validates owner-only Firestore rules.
- `test:integration` validates quick-input and review flows against the Firestore emulator.
- None of these commands should require writing secrets into the repository.
- Keep `OPENAI_API_KEY`, `LINE_CHANNEL_SECRET`, and `LINE_CHANNEL_ACCESS_TOKEN` in secure local or hosting secret stores only.
