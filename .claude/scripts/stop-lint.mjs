import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Read hook input from stdin
let input = {}
try {
  input = JSON.parse(readFileSync(0, 'utf-8'))
} catch {}

// Prevent infinite loops — if already forced to continue, let Claude stop
if (input.stop_hook_active) {
  process.exit(0)
}

// Collect changed files (modified + staged + untracked)
const changed = execSync(
  'git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard',
  { encoding: 'utf-8' },
)
  .split('\n')
  .filter((f) => f.trim() && existsSync(f))

if (changed.length === 0) {
  process.exit(0)
}

// Format changed files
try {
  execSync(`pnpm exec oxfmt ${changed.join(' ')}`, { stdio: 'pipe' })
} catch {}

// Filter to lintable files
const lintable = changed.filter((f) => /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(f))
if (lintable.length === 0) {
  process.exit(0)
}

const files = lintable.join(' ')

// Auto-fix (best-effort)
try {
  execSync(`pnpm exec oxlint --fix ${files}`, { stdio: 'pipe' })
} catch {}

// Final lint check — exit 2 to block stop if errors remain
try {
  execSync(`pnpm exec oxlint ${files}`, { stdio: 'pipe' })
} catch (e) {
  const output = e.stdout?.toString() || e.stderr?.toString() || ''
  console.log('Lint errors remain after auto-fix. Please fix:\n')
  console.log(output)
  process.exit(2)
}
