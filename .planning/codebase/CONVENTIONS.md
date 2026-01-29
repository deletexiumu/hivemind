# Coding Conventions

**Analysis Date:** 2026-01-29

## Naming Patterns

**Files:**
- kebab-case for all executable scripts and modules (`build-hooks.js`, `dw-check-update.js`)
- kebab-case for markdown commands (`execute-phase.md`, `map-codebase.md`)
- No test files in this codebase (not tested via automated test suite)

**Functions:**
- camelCase for all function declarations
- Descriptive verb-noun naming: `copyFlattenedCommands()`, `expandTilde()`, `getOpencodeGlobalDir()`
- Helper functions prefixed with verb: `get*`, `copy*`, `read*`, `write*`
- Async operations not specially marked (no Async suffix)

**Variables:**
- camelCase for variable declarations
- UPPER_SNAKE_CASE for color constants and status indicators (e.g., `cyan`, `green`, `yellow`, `dim`, `reset`)
- const for immutable values, let for reassignable values
- Meaningful names reflecting intent: `explicitConfigDir`, `selectedRuntimes`, `claudeDirRegex`

**Types/Objects:**
- Objects use descriptive names: `settings`, `result`, `config`, `data`
- No TypeScript (CommonJS/plain JavaScript)
- Inline type documentation via JSDoc for function parameters

## Code Style

**Formatting:**
- No explicit Prettier/ESLint config in package.json
- 2-space indentation (observed in all JavaScript files)
- Semicolons required (all statements end with semicolons)
- Single quotes for strings (observed throughout codebase)
- Max line length: pragmatic, no hard limit observed

**Linting:**
- No linting configuration in place
- Code is simple Node.js/script code with direct focus on clarity

**Comments:**
- Line comments use `//` with space after: `// Description`
- Block comments for function purposes placed above function declarations
- Inline comments explain non-obvious logic, environment variable priority, platform-specific behavior
- Example: `// Colors` group, `// Runtime selection - can be set by flags or interactive prompt`

## Import Organization

**Order:**
1. Node.js built-in modules (`fs`, `path`, `os`, `readline`, `child_process`)
2. Package dependencies (none in this codebase)
3. Relative imports via `require('../package.json')`

**Pattern:**
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
```

**Module System:**
- CommonJS (`require()`) exclusively
- No ES6 imports
- Direct path references with `path.join()` for cross-platform compatibility

## Function Documentation

**JSDoc Pattern:**
Functions with multiple parameters or complex logic use JSDoc blocks:

```javascript
/**
 * Get the global config directory for OpenCode
 * OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/
 * Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
function getOpencodeGlobalDir() { ... }
```

**@param/@returns:** Used selectively for complex functions:

```javascript
/**
 * Get the global config directory for a runtime
 * @param {string} runtime - 'claude' or 'opencode'
 * @param {string|null} explicitDir - Explicit directory from --config-dir flag
 */
function getGlobalDir(runtime, explicitDir = null) { ... }
```

## Error Handling

**Strategy:**
- Silent failures for non-critical operations (e.g., `catch (e) {}` for JSON parsing)
- Explicit error handling with `console.error()` and `process.exit(1)` for installation/setup errors
- Validation at entry points with early error reporting

**Pattern - Validation Error:**
```javascript
if (!nextArg || nextArg.startsWith('-')) {
  console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
  process.exit(1);
}
```

**Pattern - Silent Fail:**
```javascript
try {
  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  if (cache.update_available) { ... }
} catch (e) {}  // Silent fail - graceful degradation
```

## Logging & Output

**Approach:**
- Direct `console.log()` for user-facing output
- Color codes via ANSI escape sequences: `\x1b[36m` (cyan), `\x1b[32m` (green), `\x1b[33m` (yellow), `\x1b[2m` (dim)
- Reset with `\x1b[0m`
- Status indicators: checkmark `✓`, diamond `│`, up arrow `⬆`

**Pattern:**
```javascript
console.log(`  ${green}✓${reset} Removed orphaned ${relPath}`);
```

## Control Flow

**Conditionals:**
- Guard clauses early: check conditions upfront, return/continue early
- Ternary for simple assignments
- if/else for complex branching

**Pattern:**
```javascript
if (!fs.existsSync(src)) {
  console.warn(`Warning: ${hook} not found, skipping`);
  continue;
}
```

**Loops:**
- `for...of` for iteration with meaningful element names
- `.filter()`, `.map()`, `.sort()` for array operations
- Array methods chained when pipeline is clear

**Pattern:**
```javascript
const files = fs.readdirSync(todosDir)
  .filter(f => f.startsWith(session) && f.includes('-agent-'))
  .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
  .sort((a, b) => b.mtime - a.mtime);
```

## File Organization

**Structure:**
- Executable scripts: shebang `#!/usr/bin/env node` at top
- Imports at top
- Constants and helper functions below imports
- Main logic/execution last
- Single responsibility per file

**Pattern in `bin/install.js`:**
1. Shebang + header comment
2. Imports (`fs`, `path`, `os`, `readline`)
3. Constants (`colors`, `version from package.json`)
4. Helper functions (utility functions for install logic)
5. Main execution (user prompts, install logic)

## Markdown-Based Configuration

**Frontmatter Format (YAML):**
- Double-dash delimiters: `---`
- Fields: `name:`, `description:`, `argument-hint:`, `allowed-tools:` (array), `color:`, `tools:`

**Example from `execute-phase.md`:**
```yaml
---
name: gsd:execute-phase
description: Execute all plans in a phase with wave-based parallelization
argument-hint: "<phase-number> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
---
```

## Cross-Platform Compatibility

**Windows-Specific Patterns:**
- Use forward slashes for Node.js paths: `path.replace(/\\/g, '/')`
- Tilde expansion handled manually: `path.join(os.homedir(), path.slice(2))`
- `windowsHide: true` in child process spawning
- Path joining via `path.join()` not string concatenation

## Data Structures

**Configuration Objects:**
- Flat key-value structure
- JSON serialization with `JSON.stringify(value, null, 2) + '\n'`
- Graceful missing value handling: optional chaining `?.` and null coalescing `||`

**Pattern:**
```javascript
const settings = readSettings(settingsPath);
const model = data.model?.display_name || 'Claude';
const result = {
  update_available: latest && installed !== latest,
  installed,
  latest: latest || 'unknown',
  checked: Math.floor(Date.now() / 1000)
};
```

---

*Convention analysis: 2026-01-29*
*Update when patterns change*
