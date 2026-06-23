"use client";

import { AgentCards } from "@/components/Cards";
import { ProtectedPage } from "@/components/ProtectedPage";
import { activeOnly, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import type { AiAgent } from "@/types/firestore";

function AgentsData() {
  const agents = useFirestoreCollection<AiAgent>("ai_agents", activeOnly, true);

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>AI Agents</h1>
          <p>AI 人員中心。所有外部動作、客戶資料修改與投資相關行動都必須 Mark review。</p>
        </div>
      </header>
      <AgentCards agents={agents.items} />
    </div>
  );
}

export function AgentsClient() {
  return <ProtectedPage>{() => <AgentsData />}</ProtectedPage>;
}
