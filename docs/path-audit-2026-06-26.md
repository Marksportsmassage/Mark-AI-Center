# Path Audit - 2026-06-26

## Canonical Paths

- Assistant system canonical path: `/Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center`
- Legacy symlink path: `/Users/mark/Documents/MSM/mark-ai-center`
- 身境 path: `/Users/mark/Documents/Projects/身境`
- GitHub repo: `Marksportsmassage/Mark-AI-Center`
- Production URL: `https://mark-ai-center--mark-ai-center.asia-east1.hosted.app`

## Scan Results

The audit searched for local hard-coded paths, temporary workspace paths, old production URLs, and repo identifiers.

Found references:

- `docs/local-validation.md` referenced the old `/Users/mark/Documents/MSM/mark-ai-center` path.
- `docs/project-organization-2026-06-26.md` documents both the new canonical path and the old legacy symlink path.
- `docs/conversation-summary-2026-06-26.md` documents the canonical path.
- `docs/phase-9-12-operating-guide.md`, `src/lib/governance.ts`, and release notes reference the production hosted app URL and warn not to use `mark-ai-center.web.app`.
- `docs/project-organization-2026-06-26.md` documents the GitHub repo URL.

## Acceptable Historical References

- Legacy path references are acceptable in docs only when explicitly labeled as the legacy symlink path.
- Production URL references are acceptable because `hosted.app` is the official production URL.
- `mark-ai-center.web.app` may appear only in docs or release notes as a warning not to use it.

## Required Fixes

- Update active workflow docs to use the canonical project path first.
- Keep legacy MSM path only as a compatibility symlink note.
- Do not add hard-coded local user paths to source code or scripts.

## Unacceptable Hard-Codes

No source code hard-coded `/Users/mark/Documents/MSM/mark-ai-center`, `/workspace/Mark-AI-Center`, or `/mnt/data` paths were found during this audit.

Rules going forward:

- Scripts should use `process.cwd()`, Git root detection, or `MARK_AI_CENTER_ROOT` when needed.
- Do not require secrets for path resolution.
- Do not mix 身境 files into the assistant system repo.
