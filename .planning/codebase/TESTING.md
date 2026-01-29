# Testing Patterns

**Analysis Date:** 2026-01-29

## Test Framework

**Status:**
- No automated test framework configured
- No test files present in codebase
- No test runner (Jest, Vitest, Mocha) in devDependencies
- Manual testing approach only

**Package.json:**
- `package.json` has no test script
- Only build script: `"build:hooks": "node scripts/build-hooks.js"`
- devDependencies: only `esbuild` (for future use)

## Test Coverage

**Current State:**
- No test coverage configuration
- No coverage requirements or enforcement
- Testing is manual/ad-hoc

**Analysis Approach:**
Since this is an installer/CLI tool, testing is likely manual:
1. Run installer via `npx hivemind-cc`
2. Interactive prompts tested locally
3. Cross-platform (Windows, Mac, Linux) tested before releases
4. Hook execution verified manually in Claude Code sessions

## Code Being Tested

**Primary Executable:**
- `bin/install.js` — Installation orchestrator with interactive prompts
- `hooks/dw-check-update.js` — Background version checker
- `hooks/dw-statusline.js` — Claude Code statusline display
- `scripts/build-hooks.js` — Build script to copy hooks to dist/

**Testing Approach for These Files:**
- Installation flow: manual testing on each platform (Windows, Mac, Linux)
- Argument parsing: tested via CLI invocation with various flags
- Path handling: verified on Windows and Unix systems
- File operations: tested with actual file system operations
- JSON parsing: graceful error handling (silent failures) rather than aggressive testing

## Critical Paths (If Tests Were Added)

If testing were to be implemented, these would be the critical paths:

**Installation Logic:**
```javascript
// bin/install.js
// Path: parseConfigDirArg() - argument parsing
// Path: expandTilde() - cross-platform tilde expansion
// Path: convertClaudeToOpencodeFrontmatter() - content transformation
// Path: copyFlattenedCommands() - recursive file operations
// Path: installGSD() - main orchestrator
```

**Hook Execution:**
```javascript
// hooks/dw-check-update.js
// Path: npm view hivemind-cc version - version detection
// Path: file system reads - cache file existence

// hooks/dw-statusline.js
// Path: JSON parsing from stdin - robust error handling
// Path: file system operations - find latest todo file
```

## Error Handling Patterns Used (Without Tests)

**Graceful Degradation:**
```javascript
// Silent failures for non-critical features
try {
  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  if (cache.update_available) {
    gsdUpdate = '\x1b[33m⬆ /dw:update\x1b[0m │ ';
  }
} catch (e) {}  // Fail silently if cache missing/corrupted
```

**Explicit Validation Errors:**
```javascript
// Hard errors for critical setup steps
if (!nextArg || nextArg.startsWith('-')) {
  console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
  process.exit(1);
}
```

**Try-Catch with Default Values:**
```javascript
let installed = '0.0.0';
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
  }
} catch (e) {}
```

## Recommended Test Structure (If Adding Tests)

**Test File Location Pattern:**
- `bin/install.test.js` (alongside `bin/install.js`)
- `hooks/dw-check-update.test.js` (alongside hook file)
- `hooks/dw-statusline.test.js` (alongside hook file)
- `scripts/build-hooks.test.js` (alongside script file)

**Test Runner (Recommended):**
- Vitest 1.x (modern, fast, minimal config)
- Or Jest 29.x (if consistency with other projects needed)

**Test Framework Pattern (If Implemented):**

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseConfigDirArg } from './install.js';

describe('install.js', () => {
  describe('parseConfigDirArg', () => {
    beforeEach(() => {
      // Reset process.argv
      process.argv = ['node', 'install.js'];
    });

    it('should parse --config-dir with value', () => {
      process.argv.push('--config-dir', '/custom/path');
      const result = parseConfigDirArg();
      expect(result).toBe('/custom/path');
    });

    it('should error on missing config-dir value', () => {
      process.argv.push('--config-dir');
      expect(() => parseConfigDirArg()).toThrow('requires a path argument');
    });

    it('should handle --config-dir=value format', () => {
      process.argv.push('--config-dir=/custom/path');
      const result = parseConfigDirArg();
      expect(result).toBe('/custom/path');
    });
  });

  describe('expandTilde', () => {
    it('should expand ~ to home directory', () => {
      const result = expandTilde('~/Documents');
      expect(result).toContain('Documents');
    });

    it('should leave non-tilde paths unchanged', () => {
      const result = expandTilde('/absolute/path');
      expect(result).toBe('/absolute/path');
    });
  });
});
```

## Mock Patterns (If Needed)

**File System Mocking (Recommended):**
```javascript
import { vi } from 'vitest';
import * as fs from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  // ... other fs methods
}));

describe('file operations', () => {
  it('should handle missing files gracefully', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = readConfig('missing.json');
    expect(result).toEqual({});
  });
});
```

**Process/Child Process Mocking:**
```javascript
import { spawn } from 'child_process';

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

it('should spawn background version check', () => {
  // Mock spawn to verify it's called with correct arguments
  const mockChild = { unref: vi.fn() };
  vi.mocked(spawn).mockReturnValue(mockChild);

  checkForUpdates();

  expect(spawn).toHaveBeenCalledWith(
    expect.anything(),
    expect.arrayContaining(['-e', expect.stringContaining('npm view')])
  );
});
```

## What to Test (Priority Order)

**High Priority (Core Functionality):**
1. Argument parsing (`--global`, `--local`, `--config-dir`, `--uninstall`)
2. Path expansion (tilde to home directory on all platforms)
3. Directory resolution (global vs local, OpenCode vs Claude)
4. Frontmatter conversion (Claude → OpenCode format)
5. File copying with path replacement

**Medium Priority (Error Cases):**
1. Missing/invalid arguments
2. Permission errors on file operations
3. Corrupted JSON parsing
4. Missing version files

**Low Priority (Integration):**
1. Full installation flow (would need temp directories)
2. Hook execution (would need to mock child_process)
3. Cross-platform paths (hard to test on single system)

## What NOT to Test

- Individual color code values (ANSI escape sequences)
- Console output formatting (unless critical to feature)
- Exact error messages (brittle, changes with UX)
- Implementation details of node modules (fs, path, os)

## Manual Testing Checklist (Current Approach)

**Before Each Release:**
1. Test on Windows (WSL2 and native)
2. Test on macOS (Intel and Apple Silicon)
3. Test on Linux (Ubuntu)
4. Test with `--global` flag
5. Test with `--local` flag
6. Test with `--config-dir` custom path
7. Test `--uninstall` removes all files
8. Verify no orphaned files after install/uninstall
9. Test with both `--claude` and `--opencode` runtimes
10. Verify statusline displays correctly in Claude Code
11. Verify version check runs in background without blocking

---

*Testing analysis: 2026-01-29*
*Update when test patterns are added*
