# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**NPM Registry:**
- Service: npm JavaScript Package Registry
- What it's used for: Version checking, package distribution
- Integration point: `hooks/dw-check-update.js` calls `npm view hivemind-cc version`
- Auth: None (public registry)

**GitHub:**
- Service: Code repository and issue tracking
- What it's used for: Source code hosting, community contributions
- Integration point: Repository metadata in `package.json`
- Auth: Optional (public repo)

**Discord:**
- Service: Community chat platform
- What it's used for: User community and support
- Integration point: Invite link in installation completion message
- Auth: Not automated (user joins manually)

## AI Runtime Integrations

**Claude Code:**
- Platform: Anthropic Claude Code IDE
- How integrated: HiveMind installs to `~/.claude/` config directory
- Components: Commands (`commands/dw/`), agents (`agents/`), hooks (`hooks/`)
- Configuration file: `~/.claude/settings.json`
- Status line: Configured as custom command hook

**OpenCode:**
- Platform: Open source code assistant (alternative to Claude Code)
- How integrated: HiveMind installs to `~/.config/opencode/` directory
- Components: Flattened command structure in `command/dw-*.md`
- Configuration file: `~/.config/opencode/opencode.json`
- Permissions: Read/external_directory permissions configured during install
- Frontmatter conversion: YAML tool definitions converted for OpenCode compatibility

## Data Storage

**File System Only:**
- No databases
- No cloud storage
- Local file-based configuration and state
- Config locations:
  - Claude Code: `~/.claude/`
  - OpenCode: `~/.config/opencode/`
  - Project local: `./.claude/` or `./.opencode/`

**State Files:**
- `.planning/ROADMAP.md` - Project roadmap
- `.planning/STATE.md` - Current phase execution state
- `.planning/codebase/` - Codebase analysis documents
- `.claude/todos/` - Todo tracking (session-based)
- `.claude/cache/dw-update-check.json` - Version check cache

## Authentication & Identity

**Auth Provider:**
- Custom (None)
- No user authentication system
- User identity implicit (file system owner)
- No API keys required for core functionality

**Environment Variables for Config (Optional):**
- `CLAUDE_CONFIG_DIR` - Custom Claude Code config location
- `OPENCODE_CONFIG_DIR` - Custom OpenCode config location
- `OPENCODE_CONFIG` - Explicit OpenCode config file path
- `XDG_CONFIG_HOME` - XDG spec compliance for OpenCode

## Monitoring & Observability

**Error Tracking:**
- None detected - No automated error reporting service

**Logs:**
- Console output during installation and commands
- Hook execution logs: Standard output and file system state
- Status line displays model name, current task, context usage percentage

**Internal State Tracking:**
- `.planning/STATE.md` - Phase execution progress
- Hook cache: `~/.claude/cache/dw-update-check.json`
- Session todos: `~/.claude/todos/{session-id}-agent-*.json`

## CI/CD & Deployment

**Hosting:**
- npm (JavaScript package registry)
- GitHub (source code repository)

**CI Pipeline:**
- None detected in codebase
- Manual testing and release process

**Publishing:**
- npm package: `hivemind-cc@latest`
- Installation: `npx hivemind-cc` (pulls latest from npm)
- Update check: Background process compares installed version with npm registry

## Environment Configuration

**Required env vars:**
- None (system uses sensible defaults)

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` - Override Claude Code config path
- `OPENCODE_CONFIG_DIR` - Override OpenCode config path
- `OPENCODE_CONFIG` - Override OpenCode config file path
- `XDG_CONFIG_HOME` - XDG Base Directory spec support

**Secrets location:**
- No secrets managed by GSD
- User credentials/API keys stored by Claude Code/OpenCode directly

## Webhooks & Callbacks

**Incoming:**
- None (no server)

**Outgoing:**
- None (no external webhooks triggered)

**Hook System (Claude Code):**
- `SessionStart` hook - Runs `dw-check-update.js` background process
- Statusline hook - Renders status line in Claude Code UI
- Hook commands stored in `~/.claude/settings.json`

## Runtime Integration Points

**Claude Code Built-in Tools:**
- HiveMind agents use these tools for file operations and user interaction:
  - `Read` - Access codebase files
  - `Write` - Create/update project files
  - `Edit` - Modify existing files
  - `Bash` - Execute build/test commands
  - `Glob` - Pattern-based file discovery
  - `Grep` - Code search
  - `AskUserQuestion` - Collect user input
  - `TodoWrite` - Update task list
  - `SlashCommand` - Invoke other Claude Code commands
  - `WebFetch` - HTTP requests for research
  - `WebSearch` - Search engine queries

## Installation Configuration

**Interactive Setup:**
- Prompts user for runtime selection (Claude Code / OpenCode / Both)
- Prompts user for install location (Global / Local)
- Offers statusline installation configuration
- Handles existing statusline detection and override

**Non-Interactive Setup:**
- CLI flags: `--claude`, `--opencode`, `--both`
- Location flags: `--global`, `--local`
- Config dir: `--config-dir <path>`
- Uninstall: `--uninstall`

**Cross-Runtime Support:**
- Converts Claude Code frontmatter to OpenCode format
- Maps tool names: `AskUserQuestion` → `question`, `SlashCommand` → `skill`
- Converts color names to hex codes for OpenCode
- Flattens nested command structure (`commands/dw/help.md` → `command/dw-help.md`)

## Version Management

**Update Check Mechanism:**
- Background process spawned on Claude Code session start
- Compares `VERSION` file with `npm view hivemind-cc version`
- Cache: `~/.claude/cache/dw-update-check.json`
- Timeout: 10 seconds (non-blocking)

**Installation Versioning:**
- VERSION file written to config directory
- Checked from project location first, then global location
- User notified of available updates via status line

---

*Integration audit: 2026-01-29*
