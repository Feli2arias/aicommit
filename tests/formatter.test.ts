import { describe, it, expect } from 'vitest'
import { formatMessage, isConventionalCommit } from '../src/formatter.js'

describe('formatMessage', () => {
  it('trims leading and trailing whitespace', () => {
    expect(formatMessage('  feat: add thing  ')).toBe('feat: add thing')
  })

  it('collapses multiple newlines into a single space', () => {
    expect(formatMessage('feat: add\n\nthing')).toBe('feat: add thing')
  })

  it('truncates message to 72 characters', () => {
    const long = 'feat: ' + 'a'.repeat(80)
    expect(formatMessage(long).length).toBeLessThanOrEqual(72)
  })

  it('returns clean message unchanged', () => {
    expect(formatMessage('fix(auth): handle token expiry')).toBe('fix(auth): handle token expiry')
  })
})

describe('isConventionalCommit', () => {
  it('validates a correct conventional commit', () => {
    expect(isConventionalCommit('feat(auth): add login flow')).toBe(true)
  })

  it('validates commit without scope', () => {
    expect(isConventionalCommit('fix: correct typo in README')).toBe(true)
  })

  it('rejects commit without type prefix', () => {
    expect(isConventionalCommit('add login flow')).toBe(false)
  })

  it('rejects commit with invalid type', () => {
    expect(isConventionalCommit('wip: something')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isConventionalCommit('')).toBe(false)
  })

  it('validates all standard types', () => {
    const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
    for (const type of types) {
      expect(isConventionalCommit(`${type}: something`)).toBe(true)
    }
  })
})
