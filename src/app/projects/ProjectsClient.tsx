"use client";

import { ProjectCards, TaskDispatchList } from "@/components/Cards";
import { ProtectedPage } from "@/components/ProtectedPage";
import { activeOnly, recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import type { Project, TaskDispatch } from "@/types/firestore";

function ProjectsData({ uid }: { uid: string }) {
  const projects = useFirestoreCollection<Project>("projects", activeOnly, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p>身境 App / SaaS、AI Command Center 與其他專案的管理入口。</p>
        </div>
      </header>
      <ProjectCards projects={projects.items} />
      <TaskDispatchList tasks={tasks.items} userId={uid} />
    </div>
  );
}

export function ProjectsClient() {
  return <ProtectedPage>{(uid) => <ProjectsData uid={uid} />}</ProtectedPage>;
}
