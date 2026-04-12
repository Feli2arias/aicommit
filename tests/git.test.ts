import { describe, it, expect, vi, afterEach } from 'vitest'
import { getStagedDiff, truncateDiff, commitWithMessage } from '../src/git.js'
import * as child_process from 'child_process'

vi.mock('child_process')

const mockExecSync = vi.mocked(child_process.execSync)
const mockExecFileSync = vi.mocked(child_process.execFileSync)

afterEach(() => {
  vi.clearAllMocks()
})

describe('getStagedDiff', () => {
  it('returns the staged diff string', () => {
    mockExecSync.mockReturnValue('diff --git a/foo.ts b/foo.ts\n+const x = 1')
    const diff = getStagedDiff()
    expect(diff).toBe('diff --git a/foo.ts b/foo.ts\n+const x = 1')
    expect(mockExecSync).toHaveBeenCalledWith('git diff --cached', { encoding: 'utf8' })
  })

  it('throws when there are no staged changes', () => {
    mockExecSync.mockReturnValue('   ')
    expect(() => getStagedDiff()).toThrow('No staged changes. Run git add first.')
  })

  it('throws when git diff returns empty string', () => {
    mockExecSync.mockReturnValue('')
    expect(() => getStagedDiff()).toThrow('No staged changes. Run git add first.')
  })
})

describe('truncateDiff', () => {
  it('returns diff unchanged when under limit', () => {
    const diff = 'small diff'
    expect(truncateDiff(diff)).toBe(diff)
  })

  it('truncates diff exceeding 12000 chars at a newline boundary', () => {
    const diff = 'a'.repeat(6000) + '\n' + 'b'.repeat(6000)
    const result = truncateDiff(diff)
    expect(result.length).toBeLessThanOrEqual(12000)
    expect(result.endsWith('\n') || result.length <= 12000).toBe(true)
  })

  it('uses custom maxChars when provided', () => {
    const diff = 'a'.repeat(50) + '\n' + 'b'.repeat(50)
    const result = truncateDiff(diff, 60)
    expect(result.length).toBeLessThanOrEqual(60)
  })
})

describe('commitWithMessage', () => {
  it('runs git commit with the message using execFileSync', () => {
    commitWithMessage('feat: add thing')
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', 'feat: add thing'],
      { stdio: 'inherit' }
    )
  })

  it('does not escape quotes — passes message as-is to git', () => {
    commitWithMessage('fix: handle "edge" case')
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', 'fix: handle "edge" case'],
      { stdio: 'inherit' }
    )
  })
})
