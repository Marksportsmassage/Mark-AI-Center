import { Clock3 } from "lucide-react";
import { getTimeContext } from "@/lib/timeContext";

export function TimeContextBadge({ label = "目前時態" }: { label?: string }) {
  const context = getTimeContext();

  return (
    <div className="time-context-badge" aria-label={label}>
      <Clock3 size={16} />
      <span>{context.partOfDay}</span>
      <strong>{context.currentDate} {context.currentTime}</strong>
      <small>{context.dayOfWeek} / {context.timeZone}</small>
    </div>
  );
}
