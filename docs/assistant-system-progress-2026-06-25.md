# Assistant System Progress - 2026-06-25

## Current Delivery Goal

Mark wants the command center to feel like an assistant, not a backend console.

The usable daily flow should be:

1. Open `/assistant`.
2. Ask a natural language question.
3. See the relevant summary appear as cards.
4. See what is finished, what needs Mark review, and where to click next.
5. Use `/assistant-universe` as the visual map instead of reading long text tables.

## GPT Relay Status

Codex attempted GPT Relay twice during this work block.

Both attempts failed before the prompt was sent because the relay helper could not find the ChatGPT composer textbox in the current Chrome / ChatGPT page state.

No GPT answer was fabricated. The implementation continued from Mark's stated requirements and the existing product direction:

- Make the assistant understandable.
- Avoid text-table workflow.
- Keep universe map as visual navigation.
- Make question input trigger relevant content summaries.
- Show completed work and Mark review items proactively.

## Implemented In This Block

### Assistant Home

`/assistant` now includes a Mark-facing review deck:

- Completed system items.
- Mark review items.
- Suggested questions.
- Clickable cards for next actions.

When a prompt is passed from the universe map, `/assistant?prompt=...` automatically builds the relevant structured answer.

Exam questions now include:

- Recommended first item to read.
- Ready content.
- Mark review items.
- Topic cards.
- Links to question banks, visual summaries, and slide summaries.

### Assistant Universe

`/assistant-universe` now shows more than branch status.

Each assistant branch displays:

- What is already completed.
- What Mark needs to confirm.
- Example questions Mark can ask.
- Linked nodes for the related functional pages.

This keeps the page closer to a usable universe map and away from a backend page index.

### Today Dashboard

`/today` now includes the assistant delivery and review deck so Mark can see:

- What the assistant system has finished.
- What still requires review.
- Which cards to click next.

### Advisor Chat

`/advisor-chat` now has:

- Quick question buttons.
- Controlled natural-language question input.
- Card-style latest advisor answer.
- Review-gated action drafts.

The latest answer is no longer shown as a raw `<pre>` dump.

## Current Safety Rules

The assistant system still follows these constraints:

- No external action.
- No LINE reply / push.
- No auto payment.
- No auto trading.
- No supplier or customer contact.
- Investment answers are condition-only.
- Exam answers cannot invent questions, answers, or lecture content.
- All drafts remain review-gated.

## Next Recommended Work

1. Make `/assistant` the place that shows the newest real Firestore items in simpler language.
2. Add a lightweight "Mark reviewed" action for non-critical review cards.
3. Add a visual completion meter per assistant branch.
4. Add an exam reading mode that shows one subject at a time with large mobile cards.
5. Fix GPT Relay page state or ask Mark to reopen ChatGPT so Codex can resume GPT collaboration.

## Mark Validation Checklist

Mark should validate:

1. `/assistant` is understandable in the first 10 seconds.
2. Asking "我要準備期末考" shows exam summaries automatically.
3. Asking "股票可以加碼嗎？" does not produce unconditional buy / sell.
4. `/assistant-universe` makes it clear what each assistant branch does.
5. `/today` shows assistant completed work and Mark review items.
6. `/advisor-chat` answer is readable as cards, not a raw text dump.
