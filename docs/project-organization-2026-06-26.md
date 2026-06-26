# Project Organization - 2026-06-26

## Result

The Mark AI assistant system was moved out of the general `MSM` folder into its own project area.

## Paths

- New real path: `/Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center`
- Old compatibility path: `/Users/mark/Documents/MSM/mark-ai-center`

The old path is now a symlink so existing commands and Codex context can still work.

## Project Split

- Assistant system: `/Users/mark/Documents/Projects/mark-ai-assistant-system`
- 身境: `/Users/mark/Documents/Projects/身境`

## Notes

- The assistant system Git repo remains intact.
- The production remote remains `https://github.com/Marksportsmassage/Mark-AI-Center.git`.
- `.env.local` was not read or printed.
- No deploy was required for this filesystem cleanup.
