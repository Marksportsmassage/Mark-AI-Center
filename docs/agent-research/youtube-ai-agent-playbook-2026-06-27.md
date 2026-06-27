# YouTube / Web AI Agent Playbook - 2026-06-27

Purpose: turn agent research into buildable patterns for Mark AI Center. This is a summarized playbook; it does not copy YouTube transcripts.

## Source 1: OpenAI Agents SDK / AgentKit

- URL: https://openai.github.io/openai-agents-js/
- Source type: official docs
- Key idea: define agents with instructions, tools, guardrails, handoffs, tracing, and structured outputs.
- Implementation steps:
  1. Keep Mark AI Assistant as the shell.
  2. Add specialist agents as deterministic local modules first.
  3. Later, if Mark approves API keys, wrap selected branches with Agents SDK.
  4. Keep all tool actions draft-only until Review Queue approval.
- Fit for Mark: high.
- Effort level: medium.
- Risk: API cost, secret handling, over-automation.
- Codex can build without Mark: local agent interfaces, context registry, draft action schemas.
- Needs Mark approval: OpenAI API key, paid usage, any external tool action.

## Source 2: OpenAI AgentKit announcement

- URL: https://openai.com/index/introducing-agentkit/
- Source type: official product article
- Key idea: practical agent building needs builder, connector registry, evaluations, and chat embedding.
- Implementation steps:
  1. Treat `/agent-lab` as the local builder preview.
  2. Treat `/system-status` and tests as primitive evals.
  3. Treat GitHub issue #2 as the first connector / message bus.
- Fit for Mark: medium to high.
- Effort level: medium.
- Risk: product availability and cost may change.
- Codex can build without Mark: local equivalent screens and eval checklists.
- Needs Mark approval: external connectors and paid deployment.

## Source 3: Anthropic - Building Effective Agents

- URL: https://www.anthropic.com/research/building-effective-agents
- Source type: official engineering article
- Key idea: start with simple workflows; add autonomy only when it clearly improves outcomes.
- Implementation steps:
  1. Keep Mark tasks as workflows first: intake -> draft -> review -> action.
  2. Use router + specialist agents before multi-agent autonomy.
  3. Use evaluator / critic only for review and QA.
- Fit for Mark: very high.
- Effort level: low to medium.
- Risk: too many agents can make the system harder to understand.
- Codex can build without Mark: router, QA critic, docs, tests.
- Needs Mark approval: anything that sends, buys, trades, or deploys.

## Source 4: LangGraph / LangChain human-in-the-loop

- URLs:
  - https://www.langchain.com/langgraph
  - https://docs.langchain.com/oss/python/langchain/human-in-the-loop
- Source type: official docs
- Key idea: durable agent graphs with checkpoints, interrupts, review, edit, accept, and reject.
- Implementation steps:
  1. Model Mark AI flow as state machine: receive -> classify -> draft -> review -> approved action.
  2. Use Review Queue as the human interrupt.
  3. Store state in Firestore and docs until an agent runtime is approved.
- Fit for Mark: high.
- Effort level: medium.
- Risk: overengineering if adopted too early.
- Codex can build without Mark: local state diagrams, review queue improvements, route tests.
- Needs Mark approval: deployment of long-running jobs.

## Source 5: Google ADK

- URL: https://adk.dev/
- Source type: official docs
- Key idea: build agents with tools, evaluation, deployment paths, and multi-agent coordination.
- Implementation steps:
  1. Use ADK ideas for agent roles and evaluation without adopting runtime now.
  2. Keep the Mark stack in Next.js / Firebase unless there is a reason to add another platform.
- Fit for Mark: medium.
- Effort level: medium.
- Risk: adding another cloud stack increases complexity.
- Codex can build without Mark: architecture comparison.
- Needs Mark approval: Google Cloud agent deployment.

## Source 6: n8n AI Agents

- URL: https://docs.n8n.io/advanced-ai/intro-tutorial/
- Source type: official docs
- Key idea: connect triggers, tools, memory, and human approval for practical workflows.
- Implementation steps:
  1. Borrow the workflow canvas concept for `/assistant-universe`.
  2. Keep automation local and review-gated.
  3. Do not enable external triggers or outgoing messages until approved.
- Fit for Mark: medium.
- Effort level: low for concepts, high for full integration.
- Risk: external automation could send messages or spend money if misconfigured.
- Codex can build without Mark: local workflow cards, draft-only playbooks.
- Needs Mark approval: any n8n installation, credential, or trigger.

## Source 7: CrewAI

- URL: https://docs.crewai.com/
- Source type: official docs
- Key idea: organize work into agents, tasks, tools, crews, and flows.
- Implementation steps:
  1. Represent CFO, Investment, Exam, Client, Income, Product, and Safety as roles.
  2. Keep actual execution in deterministic code until Mark approves LLM workers.
- Fit for Mark: medium.
- Effort level: medium.
- Risk: roleplay agents can sound useful but produce weak output without strong tools.
- Codex can build without Mark: staff role cards and task routing.
- Needs Mark approval: LLM-backed crews.

## Source 8: Microsoft AutoGen

- URL: https://microsoft.github.io/autogen/
- Source type: official docs
- Key idea: event-driven multi-agent apps with conversations between agents.
- Implementation steps:
  1. Use GitHub issue #2 as a primitive multi-agent conversation log.
  2. Keep Codex and ChatGPT roles explicit.
- Fit for Mark: medium.
- Effort level: high for full integration.
- Risk: multi-agent chatter can waste time and hide decisions.
- Codex can build without Mark: relay protocol, command parser, sanitized summaries.
- Needs Mark approval: external runtime and API use.

## Source 9: Model Context Protocol

- URL: https://modelcontextprotocol.io/
- Source type: official docs
- Key idea: standardized way for AI apps to access tools and data sources.
- Implementation steps:
  1. Treat Mark data sources as explicit context providers.
  2. Keep blocked sources out of agent memory.
  3. Use MCP-style source registry even before building a real MCP server.
- Fit for Mark: high.
- Effort level: medium.
- Risk: exposing too much private data if permissions are weak.
- Codex can build without Mark: context registry and data-source policy.
- Needs Mark approval: connector installation and external data access.

## Source 10: YouTube and web tutorial pattern scan

- Search topics: AI agent tutorial, personal AI assistant agent, n8n AI agent workflow, AI chief of staff, browser automation agent, agent memory and tool calling.
- Source type: YouTube / web pattern scan.
- Key idea: most tutorials converge on the same structure: trigger, memory, tool use, planner, approval, and report.
- Implementation steps:
  1. Use Mark's natural language prompt as trigger.
  2. Pull context from sanitized memory.
  3. Route to specialist branch.
  4. Create draft or answer.
  5. Ask Mark for approval before external action.
  6. Log result and remind later.
- Fit for Mark: high.
- Effort level: low to medium.
- Risk: tutorials often skip safety, cost, and human approval.
- Codex can build without Mark: local playbooks, route cards, report templates, browser QA checklist.
- Needs Mark approval: sending, posting, purchasing, trading, customer contact, LINE push/reply.

## Buildable Patterns For Mark

1. Planner / Executor / Critic
   - Planner: creates a plan from Mark's question.
   - Executor: creates draft-only artifacts.
   - Critic: checks safety, cost, missing data, and usefulness.

2. Router + Specialist Agents
   - Router detects finance, income, investment, exam, client, product, business, or safety.
   - Specialist returns a structured answer and links.

3. Agent Memory + Retrieval
   - Use `docs/agent-memory`, `docs/master-index`, and Firestore summaries as allowed memory.
   - Do not ingest raw PDFs, secrets, or private finance screenshots into relay.

4. Review Queue / Human Approval
   - All important actions become drafts.
   - Mark approves, rejects, or asks for changes.

5. GitHub Issue Relay As Message Bus
   - Codex posts reports.
   - ChatGPT posts commands.
   - State file prevents repeat execution.

6. Local n8n-like Workflows
   - Build workflow cards in the app before connecting any automation engine.
   - Do not trigger external actions.

7. Skills / Procedural Playbooks
   - Store repeatable procedures as docs and helper functions.
   - Examples: income sprint, exam review, QA deploy, finance review.

8. Browser QA Agent
   - Check route, viewport, no overflow, no runtime error, visible h1.
   - Report evidence to docs/qa.

9. Cost Guard / Budget-aware Agent
   - Warn before deploys, functions, paid APIs, OCR, scheduled jobs.

10. Income-generation Agent
   - Turns Mark's profession and content into offer drafts, client follow-up drafts, and no-cost daily actions.
