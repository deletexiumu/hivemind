# Codebase Concerns

**Analysis Date:** 2026-01-29

## Tech Debt

**Codebase Intelligence System Removed But Not Fully Cleaned:**
- Issue: SQLite graph database and related intel system removed in v1.9.2 due to 21MB bundle size, but architectural references remain in templates and documentation
- Files: `get-shit-done/templates/codebase/concerns.md` (references removed features), documentation scattered across multiple files
- Why: Rapid decision to remove overengineered system; cleanup was incomplete
- Impact: New contributors may reference removed features, obsolete patterns persist in templates
- Fix approach: Audit all templates for dead references to `/gsd:analyze-codebase` and intel hooks; update documentation to clarify system no longer exists

**Manual Orphaned File Cleanup Required:**
- Issue: Multiple major version migrations require manual cleanup of old hook registrations and files from settings.json and file system
- Files: `bin/install.js` (lines 476-534, cleanup functions)
- Why: Settings.json hooks registry must stay in sync with installed files, but users can skip cleanup
- Impact: Settings.json bloat, potential hook registration conflicts between versions, performance degradation with orphaned entries
- Fix approach: Enhance installer to detect and warn about orphaned hooks before migration; provide automated cleanup command

**Context File Detection Fragility:**
- Issue: CONTEXT.md detection logic must match both `CONTEXT.md` and `{phase}-CONTEXT.md` filename patterns
- Files: Multiple workflows reference context file detection
- Why: File naming evolved but detection logic wasn't fully harmonized
- Impact: Context files may be skipped in phase workflows if naming doesn't match expected patterns
- Fix approach: Centralize context file detection logic in single utility function; standardize on single naming pattern

## Known Bugs

**Claude Code MCP Tool Access in Subagents (Workaround):**
- Symptoms: Subagents cannot access MCP tools (like Context7) that parent orchestrator can access
- Trigger: Subagent calls MCP tool, receives permission error or tool not found
- Files: Subagent orchestration logic across multiple agent files
- Workaround: Explicitly pass tool permissions through agent configuration; implemented in v1.9.5
- Root cause: Claude Code bug #13898 - subagent permission inheritance not working correctly
- Status: Workaround active in current release; awaiting Claude Code fix

**Context Window @ Reference Handling:**
- Symptoms: Orchestrators using `@` syntax to reference files fail with context errors
- Trigger: Task prompt contains `@file.md` reference to inline file contents
- Files: Orchestrator agents across `agents/gsd-*.md`
- Workaround: Orchestrators now inline file contents directly instead of using @ syntax
- Root cause: Claude Code doesn't expand @ references in Task prompt context properly
- Fixed in: v1.9.0

**Installation on WSL2 Non-TTY Terminals:**
- Symptoms: Interactive prompts hang or fail on WSL2/non-interactive environments (CI, Docker)
- Trigger: Running `npx get-shit-done-cc` without explicit flags in non-TTY stdin
- Files: `bin/install.js` (lines 1171, 1284)
- Status: Fixed in v1.6.4 - detects non-TTY and defaults to global install with warning
- Current mitigation: Automatic fallback to global install; users can specify flags to skip prompts

## Security Considerations

**Orphaned Hook Command Injection Risk:**
- Risk: Old hook commands remain registered in settings.json and execute paths to deleted files; could cause confusion or be exploited if path gets repurposed
- Files: `bin/install.js` (cleanup in `cleanupOrphanedHooks()` function, lines 494-534)
- Current mitigation: Automatic cleanup during install; manual cleanup available via uninstall
- Recommendations: Add validation in settings.json read/write to detect and warn about orphaned hooks before execution; consider version-stamping hook entries

**File Permissions on Installation:**
- Risk: Installation copies files to user config directories (~/.claude, ~/.config/opencode) with default umask; other local users on same machine can read config/sensitive files
- Files: `bin/install.js` (lines 397-398, 445-447, 967-968)
- Current mitigation: None - relies on OS umask defaults
- Recommendations: Explicitly set restrictive permissions (0700) on .claude and .config/opencode directories after installation; add warning about shared machines

**Settings.json JSON Parse Errors:**
- Risk: Malformed JSON in settings.json silently caught and ignored, leading to silent data loss
- Files: `bin/install.js` (lines 208-211, 750, 1050-1051)
- Current mitigation: Empty object returned on parse failure; existing settings preserved
- Recommendations: Log warning when JSON parsing fails; validate JSON before overwriting; create backup before write

**OpenCode Permissions Overwrite:**
- Risk: Installation overwrites opencode.json permissions without merging, potentially removing user-configured permissions for other tools
- Files: `bin/install.js` (lines 737-795, `configureOpencodePermissions()`)
- Current mitigation: Reads existing config and preserves, only adds GSD permissions
- Recommendations: Add explicit warning before overwriting; provide rollback mechanism

## Performance Bottlenecks

**Update Check Hook Background Process:**
- Problem: Background npm registry check on session start causes delay if npm registry is slow
- File: `hooks/gsd-check-update.js` (lines 24-61)
- Measurement: Timeout set to 10 seconds, can block session initialization if exceeded
- Cause: Synchronous spawn process waits for background task; no timeout mechanism if curl/npm hangs
- Improvement path: Reduce timeout to 5s, implement timeout monitoring, skip update check if .npm cache recently checked

**Statusline JSON Parsing on Every Session Start:**
- Problem: Statusline reads and parses multiple JSON files (todos, cache) on every keystroke context event
- File: `hooks/gsd-statusline.js` (lines 45-72)
- Measurement: Multiple fs.readdirSync and JSON.parse calls per session
- Cause: No caching of parsed state between calls
- Improvement path: Cache statusline state for 1-5 seconds; batch file reads; only parse when needed

**Directory Traversal in copyWithPathReplacement:**
- Problem: Recursive directory copy reads all files into memory for large directory trees
- File: `bin/install.js` (lines 439-471)
- Measurement: No impact on current GSD size (36KB total), but would be issue if commands/agents expand significantly
- Cause: fs.copyFileSync reads full file contents even for large binaries
- Improvement path: Use streaming copy for files >1MB; consider tar-based approach for large installations

## Fragile Areas

**Installer Argument Parsing:**
- Files: `bin/install.js` (lines 104-128, argument parsing)
- Why fragile: Complex flag parsing logic with multiple conditional branches; --config-dir handling interacts with runtime selection
- Common failures: Flag order dependencies, missing error handling for edge cases (e.g., `--config-dir=` with empty value)
- Safe modification: Add comprehensive tests for all flag combinations; use dedicated argument parser library instead of custom logic
- Test coverage: No test suite; manual testing only

**OpenCode Frontmatter Conversion:**
- Files: `bin/install.js` (lines 274-372, `convertClaudeToOpencodeFrontmatter()`)
- Why fragile: Complex YAML frontmatter parsing with state machine approach; multiple edge cases (inline tools, color conversion, tool name mapping)
- Common failures: Missing color name in mapping, malformed YAML not detected, tool names with special characters
- Safe modification: Add unit tests for all color mappings and tool conversions; use proper YAML parser instead of regex
- Test coverage: No tests; conversion validated only through manual testing

**Hook Command Path Construction:**
- Files: `bin/install.js` (lines 196-200, `buildHookCommand()`)
- Why fragile: Path construction uses string concatenation with forward slash replacement for Windows compatibility
- Common failures: Spaces in paths not escaped properly (handled by quotes), UNC paths on Windows
- Safe modification: Use path.join with proper escaping; test on actual Windows systems
- Test coverage: Basic cases tested; edge cases (spaces, special chars) untested

**Settings.json Hook Event Structure:**
- Files: `bin/install.js` (lines 1003-1026, hook registration)
- Why fragile: Settings structure assumes specific format for hooks array; array iteration assumes nested hook objects
- Common failures: Settings.json corruption, mismatched hook event types, duplicate hook entries
- Safe modification: Validate hooks structure before reading/writing; use schema validation
- Test coverage: No validation tests

## Scaling Limits

**File System Installation:**
- Current capacity: ~100 projects with local GSD installs before disk I/O becomes noticeable
- Limit: Multiple copies of 36KB codebase per installation adds up with 100+ local installs
- Symptoms at limit: Slow disk operations, installation time increases linearly
- Scaling path: Move to symbolic linking for local installs, or implement package-local installation from npm cache

**Markdown Documentation Volume:**
- Current capacity: 16,731 lines in get-shit-done templates + 7,061 lines in commands (23,792 total)
- Limit: Context window consumption when loading all documentation (~2-3% of typical Claude context at 200K limit)
- Symptoms at limit: Agents have less context for actual user request/codebase analysis
- Scaling path: Implement lazy-loading of docs; split into separate reference files; compress documentation

**Hook Processing on Session Start:**
- Current capacity: Up to 3-5 hooks can execute on SessionStart without noticeable delay
- Limit: Beyond 5-10 hooks, session initialization becomes visibly slow
- Symptoms at limit: Session startup delay >2 seconds, user perception of slow initialization
- Scaling path: Implement async hook processing with timeout; prioritize critical hooks

## Dependencies at Risk

**esbuild 0.24.0:**
- Risk: Single build dependency; no version pinning in package.json allows future breaking changes
- Impact: Hook bundling fails if esbuild introduces breaking changes
- Current protection: Works with current version; no active issues
- Migration plan: Pin to specific version (0.24.0) if stability needed; consider alternatives (swc, tsup)

**Node.js Hooks System (built-in):**
- Risk: Node.js native modules and built-in APIs may change between LTS versions
- Current usage: `fs`, `path`, `child_process`, `readline` - all stable APIs
- Impact: Low - using only stable core APIs
- Mitigation: Requires Node 16.7.0+ (package.json engines); LTS versions provide 3-year support

## Missing Critical Features

**Installation Progress Tracking:**
- Problem: No visual feedback during file copy operations; user doesn't know install is progressing on slow systems
- Current workaround: Silent copy operations complete; users wait without feedback
- Blocks: Poor user experience on slow systems or slow network installs
- Implementation complexity: Low (add progress callback to copyWithPathReplacement)

**Uninstall Dry-Run Mode:**
- Problem: No preview of what will be deleted before running `--uninstall`
- Current workaround: None - uninstall runs immediately
- Blocks: Users can't preview impact before uninstall
- Implementation complexity: Low (add --dry-run flag to uninstall function)

**Multi-Runtime Update Path:**
- Problem: Updating GSD when installed for both Claude Code and OpenCode requires two separate installs
- Current workaround: Run installer twice with --claude and --opencode flags
- Blocks: Inefficient update workflow for users with multiple runtimes
- Implementation complexity: Medium (implement runtime detection and batch install)

**Settings.json Schema Validation:**
- Problem: No schema validation before reading/writing settings.json; malformed JSON can cause silent failures
- Current workaround: Silent fallback to empty settings on parse error
- Blocks: Users can't detect corrupted settings.json
- Implementation complexity: Low (add JSON schema validation library)

## Test Coverage Gaps

**Installer Integration Tests:**
- What's not tested: End-to-end installation to both Claude Code and OpenCode; uninstall and reinstall cycles
- Risk: Breaking changes in installation flow discovered only after release
- Priority: High
- Difficulty to test: Requires mock file system and multiple runtime configurations

**Hook Execution Tests:**
- What's not tested: Actual execution of hooks in Claude Code environment; statusline rendering with various data states
- Risk: Hooks fail silently in user environments; syntax errors undetected until release
- Priority: High
- Difficulty to test: Requires Claude Code instance with proper hooks environment

**Windows-Specific Behavior:**
- What's not tested: File path handling with spaces, special characters, UNC paths; hook execution on cmd.exe and PowerShell
- Risk: Installation fails on Windows systems with problematic paths
- Priority: High
- Difficulty to test: Requires actual Windows environment for testing

**OpenCode Format Conversion:**
- What's not tested: Complex YAML frontmatter conversions; all color name mappings; tool name conversions for edge cases
- Risk: OpenCode files generated with invalid format; conversion silently drops configuration
- Priority: Medium
- Difficulty to test: Requires understanding of OpenCode format and extensive test fixtures

---

*Concerns audit: 2026-01-29*
*Update as issues are fixed or new ones discovered*
