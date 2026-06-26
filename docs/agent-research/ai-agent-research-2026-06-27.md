# AI Agent Research - 2026-06-27

Date accessed: 2026-06-27 Asia/Taipei.

## OpenAI Agents SDK

- Title: Agents SDK | OpenAI API
- URL: https://developers.openai.com/api/docs/guides/agents
- Source type: official documentation
- Takeaways: OpenAI frames agents as applications that plan, call tools, collaborate across specialists, and keep state for multi-step work. Use the SDK when the app owns orchestration, tool execution, approvals, and state.
- Fit for Mark: Strong fit later, because Mark AI Center already has routing, review queue, audit logs, and specialist branches.
- Risks: Requires API key, cost controls, evals, and strict approval gates before live tool execution.
- Practical v1 feature: Keep current rule-based assistant now; prepare an adapter layer for future Agents SDK tool calls.

## OpenAI AgentKit / Agent Builder Status

- Title: Introducing AgentKit
- URL: https://openai.com/index/introducing-agentkit/
- Source type: official OpenAI product post
- Takeaways: OpenAI updated the page noting Agent Builder and Evals are being wound down, recommending Agents SDK for code workflows and Workspace Agents for natural language workflows.
- Fit for Mark: Do not depend on visual Agent Builder as the core system. Treat code-owned workflows as safer.
- Risks: Product surface changes can create lock-in or migration work.
- Practical v1 feature: Build Mark's agent system inside this repo first, with GitHub relay and review queue as the control plane.

## OpenAI Agents SDK TypeScript

- Title: OpenAI Agents SDK TypeScript
- URL: https://openai.github.io/openai-agents-js/
- Source type: official SDK documentation
- Takeaways: TypeScript SDK is designed as a lightweight package with few abstractions.
- Fit for Mark: Good future fit because the app is Next.js / TypeScript.
- Risks: Do not wire it until API key, cost guard, evals, and approval rules are ready.
- Practical v1 feature: Define local specialist agent contracts now.

## Anthropic Building Effective Agents

- Title: Building Effective AI Agents
- URL: https://www.anthropic.com/research/building-effective-agents
- Source type: official research / engineering guidance
- Takeaways: Start with simple, composable patterns. The best implementations often avoid over-complex frameworks until they need them.
- Fit for Mark: Excellent fit. Mark's system should not become a fragile autonomous agent mesh. It should be a clear assistant shell plus specialist workflows.
- Risks: Over-agentizing pages makes the system harder to debug and more expensive.
- Practical v1 feature: Use workflows first: route question, gather context, draft answer, ask Mark for review.

## Anthropic Tool-Writing Guidance

- Title: Writing effective tools for AI agents
- URL: https://www.anthropic.com/engineering/writing-tools-for-agents
- Source type: official engineering post
- Takeaways: Tools should be tested, clear, and evaluated. Tool shape matters as much as model choice.
- Fit for Mark: Strong fit for future Firestore, GitHub relay, review queue, and income draft tools.
- Risks: Bad tools can silently create bad actions.
- Practical v1 feature: Every tool must expose `need_mark_review=true` and `external_action_allowed=false` by default.

## LangGraph / Human In The Loop

- Title: Human-in-the-loop - LangChain docs
- URL: https://docs.langchain.com/oss/python/langchain/human-in-the-loop
- Source type: official documentation
- Takeaways: Human-in-the-loop middleware can interrupt risky tool calls and wait for approval.
- Fit for Mark: Strong conceptual fit. Mark AI Center already has Review Queue and GitHub issue relay as approval gates.
- Risks: Runtime complexity if introduced too early.
- Practical v1 feature: Use Review Queue and GitHub issue markers as the HITL gate before tool automation.

## LangGraph

- Title: LangGraph Agent Orchestration Framework
- URL: https://www.langchain.com/langgraph
- Source type: official product / docs page
- Takeaways: LangGraph emphasizes state, memory, human-in-the-loop, and reliable agent orchestration.
- Fit for Mark: Useful design reference, not required immediately.
- Risks: Adds another framework and mental model.
- Practical v1 feature: Model Mark's assistant as a state graph in docs before introducing runtime.

## Google ADK

- Title: Agent Development Kit
- URL: https://adk.dev/
- Source type: official documentation
- Takeaways: ADK is a code-first framework for reliable agents in multiple languages.
- Fit for Mark: Useful reference for multi-agent design and debugging, but not a first implementation choice in this Next.js app.
- Risks: Extra cloud/platform complexity.
- Practical v1 feature: Borrow the idea of clear agent roles and tool boundaries.

## Google Cloud ADK Docs

- Title: Agent Development Kit | Gemini Enterprise Agent Platform
- URL: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk
- Source type: official cloud documentation
- Takeaways: ADK can grow from simple agents and tools into multi-agent systems.
- Fit for Mark: Good reference for future enterprise-style agent deployment.
- Risks: Could increase Google Cloud cost, which is already under watch.
- Practical v1 feature: Keep deployment local/App Hosting first.

## n8n AI Agents

- Title: n8n AI agent workflow patterns
- URL: https://docs.n8n.io/
- Source type: official product documentation
- Takeaways: n8n is strong for workflow automation and integrations.
- Fit for Mark: Useful later for simple internal automations, but not the core brain. Mark wants a new-generation assistant, not a node canvas he has to maintain.
- Risks: Easy to accidentally create external actions or hidden cost.
- Practical v1 feature: Use n8n only after approval gates and cost review.

## CrewAI / AutoGen / OpenHands

- Source type: ecosystem frameworks
- Takeaways: These are useful for multi-agent experiments, coding agents, or collaborative task decomposition.
- Fit for Mark: Lower priority than a stable assistant shell and review-gated workflow.
- Risks: More moving parts than Mark needs today.
- Practical v1 feature: Treat as research backlog, not core v1.

## Recommended Direction For Mark

Mark AI Agent v1 should be:

1. Simple and visible.
2. Time-aware.
3. Memory-backed by sanitized docs and Firestore summaries.
4. Review-gated before every external action.
5. Specialist-agent shaped, but not fully autonomous.
6. Cost-aware.
7. Useful every morning from `/assistant`.

Do not start with n8n or a heavy framework. Start with this app's Assistant Shell, context registry, planner/router, specialist branches, drafts, review queue, audit logs, and GitHub relay.
