# Local File Policy

## Do Not Commit

- `.env`, `.env.local`, `.env.*.local`
- Tokens, service accounts, API keys, credentials
- Raw finance screenshots
- Bank, credit card, ID, or account-number documents
- Original exam PDFs
- Private transcripts
- Private relay reports
- Large temporary archives or patches

## Can Commit

- Sanitized docs
- Sanitized relay reports
- Public handoff summaries
- Code and tests
- Generated study summaries that do not include private raw source files

## Rules

- Do not read or print `.env.local`.
- Do not paste full private finance data into docs.
- Do not commit source PDFs under `materials/exam`.
- Financial data in GitHub should be summary/status only.
- Original private material stays local or in Firestore, not in GitHub.
