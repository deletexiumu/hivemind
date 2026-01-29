# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**NPM Registry:**
- Service: npm JavaScript Package Registry
- What it's used for: Version checking, package distribution
- Integration point: `hooks/gsd-check-update.js` calls `npm view get-shit-done-cc version`
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
- How integrated: GSD installs to `~/.claude/` config directory
- Components: Commands (`commands/gsd/`), agents (`agents/`), hooks (`hooks/`)
- Configuration file: `~/.claude/settings.json`
- Status line: Configured as custom command hook

**OpenCode:**
- Platform: Open source code assistant (alternative to Claude Code)
- How integrated: GSD installs to `~/.config/opencode/` directory
- Components: Flattened command structure in `command/gsd-*.md`
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
- `.claude/cache/gsd-update-check.json` - Version check cache

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
- Hook cache: `~/.claude/cache/gsd-update-check.json`
- Session todos: `~/.claude/todos/{session-id}-agent-*.json`

## CI/CD & Deployment

**Hosting:**
- npm (JavaScript package registry)
- GitHub (source code repository)

**CI Pipeline:**
- None detected in codebase
- Manual testing and release process

**Publishing:**
- npm package: `get-shit-done-cc@latest`
- Installation: `npx get-shit-done-cc` (pulls latest from npm)
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
- `SessionStart` hook - Runs `gsd-check-update.js` background process
- Statusline hook - Renders status line in Claude Code UI
- Hook commands stored in `~/.claude/settings.json`

## Runtime Integration Points

**Claude Code Built-in Tools:**
- GSD agents use these tools for file operations and user interaction:
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
- Flattens nested command structure (`commands/gsd/help.md` → `command/gsd-help.md`)

## Version Management

**Update Check Mechanism:**
- Background process spawned on Claude Code session start
- Compares `VERSION` file with `npm view get-shit-done-cc version`
- Cache: `~/.claude/cache/gsd-update-check.json`
- Timeout: 10 seconds (non-blocking)

**Installation Versioning:**
- VERSION file written to config directory
- Checked from project location first, then global location
- User notified of available updates via status line

---

*Integration audit: 2026-01-29*
