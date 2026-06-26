# Codex Relay Safety

Never include:

- Secrets
- `.env` or `.env.local` contents
- Tokens
- Service account JSON
- Card numbers
- Bank account numbers
- Identity numbers
- Raw finance screenshots
- Full private conversations
- Private raw data

Allowed in relay reports:

- Sanitized task summaries
- Code file names
- Test results
- Commit SHAs
- Non-sensitive operational status
- Finance status summaries without raw account details

Rules:

- Private raw data stays local or in Firestore.
- Public handoff summaries can be committed.
- Private transcripts should go under ignored private transcript folders.
