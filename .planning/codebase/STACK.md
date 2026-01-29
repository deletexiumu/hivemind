# Technology Stack

**Analysis Date:** 2026-01-29

## Languages

**Primary:**
- JavaScript (Node.js) - All runtime scripts, installation, and hooks
- Markdown - All command definitions, agent specifications, and documentation

**Secondary:**
- YAML - Frontmatter configuration in markdown files

## Runtime

**Environment:**
- Node.js >= 16.7.0

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Claude Code / OpenCode - AI assistant runtime environments (target platforms)

**Build/Dev:**
- esbuild ^0.24.0 - JavaScript bundler for hook compilation

## Key Dependencies

**Production:**
- None (zero production dependencies in the main package)

**Development:**
- esbuild ^0.24.0 - Bundler for compilation of hook scripts

## Configuration

**Environment:**
- `CLAUDE_CONFIG_DIR` - Override default Claude Code config directory (default: `~/.claude`)
- `OPENCODE_CONFIG_DIR` - Override OpenCode config directory (default: `~/.config/opencode`)
- `OPENCODE_CONFIG` - Alternative: specify full path to OpenCode config file
- `XDG_CONFIG_HOME` - XDG Base Directory spec support for OpenCode

**Build:**
- `scripts/build-hooks.js` - Copies hooks to `hooks/dist/` directory before publishing
- Run with: `npm run build:hooks`

**Installation:**
- `bin/install.js` - Main installation script
- Supports both interactive and non-interactive modes
- Global installation: `~/.claude/` (Claude Code) or `~/.config/opencode/` (OpenCode)
- Local installation: `./.claude/` or `./.opencode/` in project directory

## Platform Requirements

**Development:**
- Node.js >= 16.7.0
- Cross-platform: Windows, Mac, Linux (WSL2 supported)
- POSIX-compatible shell for interactive setup

**Production:**
- Claude Code (2024+) or OpenCode (open source models)
- File system access for config directory
- Terminal/CLI environment for status line and hooks

## File Structure

**Installed Files:**
- `bin/install.js` - Entry point for `hivemind-cc` command
- `hooks/dist/*.js` - Compiled hook scripts
  - `dw-statusline.js` - Status line showing model, task, context usage
  - `dw-check-update.js` - Background update checker (calls npm registry)
- `commands/dw/*.md` - Command definitions for Claude Code / OpenCode
- `agents/dw-*.md` - Sub-agents (planner, executor, debugger, etc.)
- `hivemind/*` - HiveMind reference documentation and templates

## Code Style

**Format:**
- 2-space indentation in JavaScript
- LF line endings
- No TypeScript (pure JavaScript)

**Standards:**
- CommonJS modules (`require`, `exports`)
- Async patterns with callbacks and spawned processes
- No external dependencies for runtime scripts

## Hook System Integration

**Claude Code Hooks:**
- Registered in `~/.claude/settings.json` under `hooks.SessionStart`
- Hook type: `command` with Node.js script
- Example: `node ~/.claude/hooks/dw-statusline.js`

**OpenCode Hooks:**
- Permissions configured in `~/.config/opencode/opencode.json`
- Read permissions required for HiveMind reference docs
- External directory permissions for custom config paths

## Update Mechanism

**Version Tracking:**
- `VERSION` file written to config directory on install
- Checked against npm registry via `npm view hivemind-cc version`
- Background check runs on Claude Code session start
- Cache stored in `~/.claude/cache/dw-update-check.json`

## Tool Dependencies (Claude Code)

These are Claude Code built-in tools available to HiveMind agents:

**File Operations:**
- `Read` - Read files from disk
- `Write` - Write files to disk
- `Edit` - Edit existing files
- `Bash` - Execute shell commands

**Code Analysis:**
- `Glob` - Pattern-based file matching
- `Grep` - Text search with regex
- `SlashCommand` - Invoke other Claude Code commands

**User Interaction:**
- `AskUserQuestion` - Prompt user for input
- `TodoWrite` - Update Claude Code todo list

**Web Access:**
- `WebFetch` - HTTP requests
- `WebSearch` - Search engine queries

**Claude Integrations:**
- `mcp__context7__*` - MCP tools (Model Context Protocol)

---

*Stack analysis: 2026-01-29*
