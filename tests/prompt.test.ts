import { describe, it, expect } from 'vitest'
import { buildPrompt } from '../src/prompt.js'

const SAMPLE_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
+export function login(user: string, pass: string) {
+  return db.query('SELECT * FROM users WHERE email = ?', [user, pass])
+}`

describe('buildPrompt', () => {
  it('includes the diff in the user message', () => {
    const { user } = buildPrompt(SAMPLE_DIFF)
    expect(user).toContain(SAMPLE_DIFF)
  })

  it('system prompt requires Conventional Commits format', () => {
    const { system } = buildPrompt(SAMPLE_DIFF)
    expect(system).toContain('type(scope): description')
  })

  it('system prompt requires subject line under 72 characters', () => {
    const { system } = buildPrompt(SAMPLE_DIFF)
    expect(system).toContain('72')
  })

  it('system prompt requires returning only the commit message', () => {
    const { system } = buildPrompt(SAMPLE_DIFF)
    expect(system.toLowerCase()).toContain('only')
  })

  it('includes type hint when provided', () => {
    const { system } = buildPrompt(SAMPLE_DIFF, 'fix')
    expect(system).toContain('"fix"')
  })

  it('does not mention a forced type when no hint is given', () => {
    const { system } = buildPrompt(SAMPLE_DIFF)
    expect(system).not.toContain('MUST use')
  })

  it('matches snapshot', () => {
    const result = buildPrompt('diff --git a/foo.ts b/foo.ts\n+const x = 1')
    expect(result).toMatchSnapshot()
  })
})
