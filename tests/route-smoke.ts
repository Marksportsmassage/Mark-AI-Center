import { spawn, type ChildProcess } from "node:child_process";

const port = Number(process.env.SMOKE_PORT ?? 3210);
const baseUrl = `http://127.0.0.1:${port}`;
const routes = [
  { path: "/login", text: "Sign in" },
  { path: "/advisor-chat" },
  { path: "/client-ops" },
  { path: "/content-studio" },
  { path: "/business-lab" },
  { path: "/product-roadmap" },
  { path: "/today", text: "Today" },
  { path: "/command-center", text: "Command Center" },
  { path: "/intake", text: "Intake" },
  { path: "/review-queue", text: "Review Queue" },
  { path: "/finance-advisor", text: "Finance" },
  { path: "/finance-baseline", text: "Baseline" },
  { path: "/net-worth" },
  { path: "/cashflow" },
  { path: "/system-status" },
  { path: "/decision-lab", text: "Decision Lab" },
  { path: "/capital-plan" },
  { path: "/recovery-plans" },
  { path: "/weekly-review", text: "Weekly" },
  { path: "/monthly-close" },
  { path: "/followups" },
  { path: "/release-notes", text: "版本紀錄" },
  { path: "/data-quality" },
  { path: "/finance-decisions", text: "Finance Decisions" },
  { path: "/expense-signals" },
  { path: "/investment-decisions", text: "Investments" },
  { path: "/audit-logs", text: "Audit" },
  { path: "/universe" },
  { path: "/knowledge-sop" },
  { path: "/codex-jobs" }
];
const forbiddenBodyText = [
  "Application error",
  "Internal Server Error",
  "Cannot read properties of undefined",
  "TypeError:",
  "ReferenceError:",
  "__next_error__"
];

let server: ChildProcess | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Keep polling until next start is ready.
    }
    await sleep(500);
  }
  throw new Error(`Smoke server did not become ready at ${baseUrl}`);
}

async function checkRoute(route: { path: string; text?: string }) {
  const response = await fetch(`${baseUrl}${route.path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status >= 500) throw new Error(`${route.path} returned ${response.status}`);
  if (body.trim().length < 500) throw new Error(`${route.path} returned a suspiciously small body (${body.length} bytes)`);
  if (!body.includes("__next")) throw new Error(`${route.path} did not include Next.js assets`);
  if (route.text && !body.includes(route.text)) throw new Error(`${route.path} did not include expected text: ${route.text}`);
  const forbidden = forbiddenBodyText.find((text) => body.includes(text));
  if (forbidden) throw new Error(`${route.path} included runtime error marker: ${forbidden}`);
  console.log(`ok ${route.path} ${response.status} ${body.length} bytes`);
}

async function main() {
  server = spawn("npm", ["run", "start", "--", "-H", "127.0.0.1", "-p", String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout?.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr?.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));

  try {
    await waitForServer();
    for (const route of routes) {
      await checkRoute(route);
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  if (server) server.kill("SIGTERM");
  console.error(error);
  process.exit(1);
});
