# Codebase Structure

**Analysis Date:** 2026-01-29

## Directory Layout

```
hivemind/
├── bin/                       # Installation entry points
│   └── install.js            # Main installer (npx entry)
├── scripts/                   # Build scripts
│   └── build-hooks.js        # Hook build utility
├── hooks/                     # Installation hooks
│   ├── dw-check-update.js   # Version check hook
│   ├── dw-statusline.js     # Status display hook
│   └── dist/                 # Built hooks (generated)
├── agents/                    # Subagent definitions (spawned by orchestrator)
│   ├── dw-executor.md       # Executes PLAN.md files atomically
│   ├── dw-planner.md        # Generates PLAN.md files from phase context
│   ├── dw-verifier.md       # Validates execution outputs
│   ├── dw-codebase-mapper.md # Analyzes codebase, writes STACK/ARCH/etc
│   ├── dw-project-researcher.md # Deep research on project space
│   ├── dw-phase-researcher.md  # Phase-specific research
│   ├── dw-plan-checker.md   # Validates PLAN.md format
│   ├── dw-integration-checker.md # Checks external integrations
│   ├── dw-debugger.md       # Debug aid for issues
│   ├── dw-roadmapper.md     # Creates ROADMAP.md structure
│   └── dw-research-synthesizer.md # Synthesizes research results
├── commands/                  # User-facing slash commands
│   └── gsd/                  # HiveMind command definitions (27 commands)
│       ├── new-project.md    # Initialize new project
│       ├── plan-phase.md     # Generate execution plans
│       ├── execute-phase.md  # Run plans with orchestration
│       ├── map-codebase.md   # Analyze codebase structure
│       ├── new-milestone.md  # Create milestone
│       ├── progress.md       # Show project progress
│       ├── verify-work.md    # Run verification checks
│       ├── debug.md          # Debug mode
│       └── [24 more commands]
├── hivemind/            # Skill resources (installed to ~/.claude/)
│   ├── templates/            # Reusable document templates
│   │   ├── project.md        # PROJECT.md template
│   │   ├── phase-prompt.md   # PLAN.md template (executable)
│   │   ├── summary.md        # SUMMARY.md template
│   │   ├── state.md          # STATE.md template (project memory)
│   │   ├── roadmap.md        # ROADMAP.md template
│   │   ├── requirements.md   # REQUIREMENTS.md template
│   │   ├── discovery.md      # Discovery doc template
│   │   ├── UAT.md            # User acceptance test template
│   │   ├── verification-report.md # Verification template
│   │   ├── context.md        # CONTEXT.md template
│   │   ├── config.json       # Config defaults template
│   │   ├── codebase/         # Codebase analysis templates
│   │   │   ├── architecture.md # ARCHITECTURE.md template
│   │   │   ├── structure.md  # STRUCTURE.md template
│   │   │   ├── stack.md      # STACK.md template
│   │   │   ├── integrations.md # INTEGRATIONS.md template
│   │   │   ├── conventions.md # CONVENTIONS.md template
│   │   │   ├── testing.md    # TESTING.md template
│   │   │   └── concerns.md   # CONCERNS.md template
│   │   └── [7 more templates]
│   ├── workflows/            # Orchestration logic (12 workflows)
│   │   ├── execute-phase.md  # Wave-based plan execution
│   │   ├── execute-plan.md   # Single plan execution protocol
│   │   ├── map-codebase.md   # Codebase analysis workflow
│   │   ├── verify-phase.md   # Verification workflow
│   │   ├── discovery-phase.md # Discovery workflow
│   │   ├── diagnose-issues.md # Issue diagnosis
│   │   └── [6 more workflows]
│   └── references/           # Methodological guidance (9 documents)
│       ├── questioning.md    # Discovery questioning patterns
│       ├── tdd.md           # Test-driven development patterns
│       ├── checkpoints.md   # Checkpoint handling patterns
│       ├── continuation-format.md # Session resume format
│       ├── verification-patterns.md # Verification approaches
│       ├── model-profiles.md # Model selection guidance
│       └── [3 more references]
├── assets/                   # Static assets
│   └── terminal.svg         # Install demo SVG
├── .github/                  # GitHub integration
├── .planning/               # Project state (created during init)
│   └── codebase/           # Codebase analysis (from /dw:map-codebase)
├── .claude/                 # Installation target (development only)
├── package.json             # Project manifest
├── package-lock.json        # Dependency lock
├── README.md                # User installation guide
├── CHANGELOG.md             # Release notes
├── CONTRIBUTING.md          # Contribution guide
├── HIVEMIND-STYLE.md            # Style guide for development
├── MAINTAINERS.md          # Maintainer info
└── LICENSE                  # MIT license
```

## Directory Purposes

**bin/**
- Purpose: CLI entry points for package installation
- Contains: Node.js executable scripts
- Key files: `install.js` - handles npx installation, prompts for runtime/location, copies files to appropriate config directory
- Subdirectories: None (flat structure)

**scripts/**
- Purpose: Build and development utilities
- Contains: Build scripts (not runtime)
- Key files: `build-hooks.js` - copies hooks from source to dist/ for packaging
- Subdirectories: None

**hooks/**
- Purpose: Post-installation scripts that integrate with Claude Code/OpenCode
- Contains: Node.js hook scripts and dist/ directory with built versions
- Key files: `dw-check-update.js`, `dw-statusline.js` (both copied to user's ~/.claude/hooks/)
- Subdirectories: `dist/` - generated hooks (not committed initially, generated on publish)

**agents/**
- Purpose: Subagent specifications spawned by orchestrator
- Contains: Markdown files with `<role>`, `<execution_flow>`, context requirements
- Key files: `dw-executor.md` (executes plans), `dw-planner.md` (generates plans), `dw-verifier.md` (validates output)
- Subdirectories: None (flat, 11 specialized agents)

**commands/dw/**
- Purpose: User-facing slash command definitions
- Contains: One markdown file per command (27 total)
- Key files: `new-project.md`, `plan-phase.md`, `execute-phase.md`, `map-codebase.md`
- Subdirectories: None (flat structure, prefix `gsd:` added by installer)

**hivemind/templates/codebase/**
- Purpose: Templates for codebase analysis documents
- Contains: 7 markdown templates with structure and examples
- Key files: `architecture.md`, `structure.md`, `stack.md`, `integrations.md`, `conventions.md`, `testing.md`, `concerns.md`
- Used by: `/dw:map-codebase` agents to generate `.planning/codebase/` documents

**hivemind/templates/** (root)
- Purpose: Document templates for project lifecycle
- Contains: Templates for PROJECT.md, ROADMAP.md, PLAN.md, STATE.md, and others
- Key files: `project.md`, `phase-prompt.md` (PLAN.md template), `state.md`
- Subdirectories: `codebase/` (analysis templates), `research-project/` (research templates)

**hivemind/workflows/**
- Purpose: Reusable orchestration logic
- Contains: Markdown workflows with `<step>` elements and decision logic
- Key files: `execute-phase.md`, `verify-phase.md`, `map-codebase.md`
- Subdirectories: None (flat, 12 workflows)

**hivemind/references/**
- Purpose: Methodological guidance baked into system
- Contains: Reference documents on patterns, principles, approaches
- Key files: `questioning.md`, `checkpoints.md`, `verification-patterns.md`
- Subdirectories: None (flat, 9 references)

## Key File Locations

**Entry Points:**
- `bin/install.js` - Installation entry point (npx entry)
- `commands/dw/*.md` - User commands (e.g., `/dw:new-project`)

**Configuration:**
- `package.json` - Project metadata, bin entry, dependencies
- `hivemind/templates/config.json` - Default workflow configuration
- `.planning/config.json` - Created per-project during init

**Core Logic:**
- `bin/install.js` - All installation logic (file copying, path adaptation, hook setup)
- `agents/` - Specialized execution agents
- `hivemind/workflows/` - Orchestration patterns

**Templates & References:**
- `hivemind/templates/` - Document templates with placeholders
- `hivemind/references/` - Methodological guidance documents

**Documentation:**
- `README.md` - Installation and getting started guide
- `CONTRIBUTING.md` - Contributor guidelines
- `HIVEMIND-STYLE.md` - Style guide for system development
- `CHANGELOG.md` - Release history

## Naming Conventions

**Files:**
- `kebab-case.md` - Markdown documents (templates, workflows, references, commands)
- `kebab-case.js` - JavaScript source files (install.js, hooks)
- `UPPERCASE.md` - Top-level project docs (README.md, CHANGELOG.md, LICENSE)
- `dw-*.md` - Agent files (dw-executor.md, dw-planner.md, etc.)
- `{name}.md` - Slash command definition (new-project.md, plan-phase.md, etc.)

**Directories:**
- `kebab-case/` - All directories use kebab-case
- Plural for collections: `agents/`, `commands/`, `templates/`, `workflows/`, `references/`
- Nested: `commands/dw/`, `hivemind/templates/`, `hivemind/workflows/`

**Special Patterns:**
- `{phase}-{plan}-PLAN.md` - Execution plans generated during planning (e.g., `01-01-PLAN.md`)
- `{phase}-{plan}-SUMMARY.md` - Execution summaries created after running plans
- `*-SUMMARY.md` - Marks plan as complete in workflow
- `.planning/` - Project state directory (created per-project, gitignored by default)

## Where to Add New Code

**New Slash Command:**
- Primary code: `commands/dw/{command-name}.md`
- Template: Copy structure from existing command (frontmatter + objective/process/success_criteria)
- Workflow delegation: Create in `hivemind/workflows/{command-name}.md` if complex logic
- Test: Documented in CONTRIBUTING.md

**New Agent:**
- Implementation: `agents/dw-{agent-name}.md`
- Template: Role statement + execution_flow + context requirements
- Trigger: Referenced from command or workflow via Task tool
- Used for: Specialized autonomous work (planning, execution, research, verification)

**New Template:**
- Implementation: `hivemind/templates/{name}.md`
- Format: Header + optional `<template>` block + guidelines
- Usage: Referenced via `@~/.claude/hivemind/templates/{name}.md` in commands/agents
- Purpose: Reusable specification for project artifacts

**New Workflow:**
- Implementation: `hivemind/workflows/{name}.md`
- Format: Sections with `<step>` elements or semantic XML containers
- Usage: Referenced via `@~/.claude/hivemind/workflows/{name}.md` in commands
- Purpose: Reusable orchestration logic shared across commands

**New Reference:**
- Implementation: `hivemind/references/{name}.md`
- Format: Semantic container + markdown headers for organization
- Usage: Loaded as context in agent prompts where pattern guidance needed
- Purpose: Methodological guidance (testing patterns, questioning patterns, etc.)

**Utilities:**
- Shared logic in `bin/install.js` (currently monolithic)
- If extracted: Create `scripts/{utility}.js` for build-time helpers

## Special Directories

**`.planning/`**
- Purpose: Project state directory (created during `/dw:new-project`)
- Generated by: User command initialization
- Committed: No (typically in .gitignore, but configurable via config.json)
- Contains: PROJECT.md, STATE.md, ROADMAP.md, phases/, codebase/, todos/

**`hooks/dist/`**
- Purpose: Build output for hooks (generated by `npm run build:hooks`)
- Generated by: `scripts/build-hooks.js` (runs during `npm prepublishOnly`)
- Committed: No (generated on publish)
- Contains: Copied hooks ready for installation

**`.claude/`**
- Purpose: Installation target for development/local testing
- Generated by: `bin/install.js` with `--local` flag
- Committed: No (local-only)
- Contains: Copy of commands/, agents/, hivemind/ for local testing

---

*Structure analysis: 2026-01-29*
*Update when directory structure changes*
