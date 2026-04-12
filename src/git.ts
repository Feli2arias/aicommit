import { execSync } from 'child_process'

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
  return diff.slice(0, maxChars)
}

export function commitWithMessage(message: string): void {
  const escaped = message.replace(/"/g, '\\"')
  execSync(`git commit -m "${escaped}"`, { stdio: 'inherit' })
}
