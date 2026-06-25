import Link from "next/link";
import { assistantRiskLabel, type AssistantSuggestion } from "@/lib/assistantExperience";

export function AssistantSuggestionPanel({ suggestion }: { suggestion: AssistantSuggestion }) {
  return (
    <article className={`assistant-suggestion risk-${suggestion.risk}`}>
      <div className="item-header">
        <h3>{suggestion.title}</h3>
        <span className="badge review">{assistantRiskLabel(suggestion.risk)}</span>
      </div>
      <p><strong>為什麼重要：</strong>{suggestion.why}</p>
      <p><strong>不做的影響：</strong>{suggestion.impact_if_ignored}</p>
      <p><strong>下一步：</strong>{suggestion.next_action}</p>
      <div className="action-row">
        <Link className="button compact" href={suggestion.href}>前往</Link>
        {suggestion.draft_label ? <button className="button secondary compact" type="button">{suggestion.draft_label}</button> : null}
        <button className="button secondary compact" type="button">稍後</button>
      </div>
    </article>
  );
}
