# Architecture

**Analysis Date:** 2026-01-29

## Pattern Overview

**Overall:** Multi-Agent Orchestration System with Markdown-Based Prompting

**Key Characteristics:**
- Distributed agent architecture spawned by slash commands
- Markdown files serve as both specification and executable context
- XML/YAML frontmatter for semantic markup and configuration
- Bidirectional context flow via file-based state management
- Zero external dependencies (pure Node.js for installation)

## Layers

**Orchestration Layer:**
- Purpose: Route user commands to appropriate subagents, coordinate parallel execution, manage checkpoints
- Location: `commands/gsd/` (slash command definitions), `get-shit-done/workflows/` (orchestration logic)
- Contains: Command handlers that spawn agents, workflow coordination logic, state management
- Depends on: File system for state, markdown parsing for frontmatter, subprocess spawning via Task tool
- Used by: Claude Code user invoking `/gsd:` commands

**Agent Layer:**
- Purpose: Execute specialized work (planning, execution, verification, research) with full context
- Location: `agents/` (11 specialized agents)
- Contains: Agent definitions with `<role>`, `<execution_flow>`, task descriptions
- Depends on: Project state (STATE.md, PROJECT.md, config.json), workflows they implement
- Used by: Orchestration layer via Task tool spawning

**Template & Reference Layer:**
- Purpose: Provide reusable specifications and pattern definitions
- Location: `get-shit-done/templates/` (project/plan templates), `get-shit-done/references/` (principles, patterns)
- Contains: Markdown templates with placeholders, reference documents encoding methodology
- Depends on: Nothing (source of truth)
- Used by: Commands and agents as context, examples, format specifications

**Installation/Integration Layer:**
- Purpose: Install GSD into Claude Code or OpenCode environments
- Location: `bin/install.js` (installer), `hooks/` (post-installation scripts)
- Contains: Cross-platform installation logic, runtime adaptation (Claude vs OpenCode)
- Depends on: Node.js fs, path modules
- Used by: `npm install` / `npx get-shit-done-cc` during setup

## Data Flow

**Phase Execution Flow (Primary):**

1. User invokes `/gsd:plan-phase` command
2. Orchestrator loads STATE.md, PROJECT.md, ROADMAP.md
3. Orchestrator spawns `gsd-planner` agent with phase requirements
4. Planner reads phase context, templates, prior decisions
5. Planner generates `.planning/phases/NN-name/*-PLAN.md` files (wave-sorted, dependency-aware)
6. Planner updates STATE.md with plan summary
7. User reviews plans (checkpoints or automatic)
8. User invokes `/gsd:execute-phase`
9. Orchestrator reads plans, analyzes wave dependencies
10. Orchestrator spawns parallel `gsd-executor` agents per wave
11. Each executor loads full PLAN context, executes tasks atomically
12. Each executor commits per-task, creates SUMMARY.md
13. Orchestrator collects summaries, updates STATE.md
14. If verification enabled: orchestrator spawns `gsd-verifier` to validate outputs
15. Orchestrator reports completion, next steps

**State Management:**
- File-based: `.planning/` directory is single source of truth
- Projects live independently — no global state
- Each session loads STATE.md first, updates after significant actions
- Stateless agents — full context passed each execution (no agent memory)
- Config-driven behavior (config.json controls gates, parallelization, workflow options)

**Context Engineering Pattern:**
- Templates + References provide methodological context
- Commands/workflows include `@-references` to load files into agent context
- Agent prompts include execution flow as inline steps (imperative instructions)
- PLAN.md files are "executable prompts" — agents follow task structure exactly
- Minimal context chaining (avoid Plan 2 refs Plan 1, Plan 3 refs Plan 2, etc.)

## Key Abstractions

**Command:**
- Purpose: User-facing interface to system capabilities
- Examples: `commands/gsd/new-project.md`, `commands/gsd/execute-phase.md`, `commands/gsd/map-codebase.md`
- Pattern: YAML frontmatter + process steps that delegate to workflows or agents

**Workflow:**
- Purpose: Reusable orchestration logic shared across commands
- Examples: `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/map-codebase.md`
- Pattern: Multi-step coordination with branching logic, state checks, error handling

**Agent:**
- Purpose: Autonomous executor specialized for a domain (planning, execution, verification, research)
- Examples: `agents/gsd-executor.md`, `agents/gsd-planner.md`, `agents/gsd-verifier.md`
- Pattern: Role statement + execution flow + context requirements, spawned via Task tool

**Template:**
- Purpose: Reusable specification format for project artifacts
- Examples: `get-shit-done/templates/project.md`, `get-shit-done/templates/phase-prompt.md`
- Pattern: Markdown file with placeholders and inline guidelines

**Reference:**
- Purpose: Methodological guidance embedded in system
- Examples: `get-shit-done/references/checkpoints.md`, `get-shit-done/references/tdd.md`
- Pattern: Markdown document explaining approach, used as context in agent prompts

## Entry Points

**User Interaction Entry:**
- Location: `/gsd:<command>` slash commands in Claude Code interface
- Triggers: User types command in Chat
- Responsibilities: Parse arguments, validate preconditions, spawn orchestration workflow

**Orchestration Entry:**
- Location: `get-shit-done/workflows/` files (referenced via `@~/.claude/...` in commands)
- Triggers: Command completes initial validation
- Responsibilities: Coordinate subagents, manage state transitions, handle checkpoints

**Agent Entry:**
- Location: `agents/*.md` role statements and execution flows
- Triggers: Orchestrator spawns agent via Claude Task tool with full context
- Responsibilities: Execute specialized work, produce artifacts, report completion

**Installation Entry:**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc` command
- Responsibilities: Detect runtime (Claude vs OpenCode), copy files to config directory, adapt frontmatter

## Error Handling

**Strategy:** Fail-fast with informative messages. Agents throw errors with context, orchestrator catches and reports.

**Patterns:**
- Commands validate preconditions before spawning agents (e.g., check `.planning/` exists)
- Agents check loaded state validity before proceeding
- Task execution in PLAN files uses verify steps to confirm each action
- Orchestrator handles checkpoint messages and user decisions
- State recovery: Load prior STATE.md to resume interrupted sessions

## Cross-Cutting Concerns

**Logging:**
- Commands output status to console (informational flow)
- Agents log execution progress in task verify steps
- SUMMARY.md captures execution timeline and decisions
- STATE.md updated after each phase/plan completion for visibility

**Validation:**
- Commands validate file existence and format
- Agents validate frontmatter parsing (phase, plan, type, wave, etc.)
- PLAN.md tasks include verify steps to confirm outputs
- Config.json drives gate checks (confirm_project, confirm_plan, etc.)

**Authentication/Authorization:**
- No multi-user system (solo developer + Claude model)
- File-based access control via .planning/ directory permissions
- Config.json gates control user interaction flow
- Tool permissions managed via Claude Code `settings.json` or OpenCode equivalents

**Orchestration:**
- Wave-based parallelization: Plans grouped by wave number, executed in parallel when safe
- Dependency tracking: Plans declare `depends_on: []` to enforce ordering
- Checkpoint protocol: Autonomous plans run fully, checkpoint plans pause for user input
- Model selection: config.json specifies which models for planner/executor/verifier

---

*Architecture analysis: 2026-01-29*
*Update when major structural patterns change*
