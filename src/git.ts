import { execSync, execFileSync } from 'child_process'

export function getStagedDiff(): string {
  const diff = execSync('git diff --cached', { encoding: 'utf8' })
  if (!diff.trim()) {
    throw new Error('No staged changes. Run git add first.')
  }
  return diff
}

export function truncateDiff(diff: string, maxChars = 12000): string {
  if (diff.length <= maxChars) return diff
  const approxTokens = Math.round(diff.length / 4)
  console.warn(`⚠  Diff truncated to ~3000 tokens (was ~${approxTokens} tokens)`)
  const cutPoint = diff.lastIndexOf('\n', maxChars)
  return diff.slice(0, cutPoint > 0 ? cutPoint : maxChars)
}

export function commitWithMessage(message: string): void {
  execFileSync('git', ['commit', '-m', message], { stdio: 'inherit' })
}
