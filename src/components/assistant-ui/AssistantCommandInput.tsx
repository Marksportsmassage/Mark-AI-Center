"use client";

export function AssistantCommandInput({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string }) {
  return <div className="assistant-main-prompt"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button className="button compact" type="button" onClick={onSubmit}>送出</button></div>;
}
