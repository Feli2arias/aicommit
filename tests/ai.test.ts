import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createProvider } from '../src/ai.js'
import type { Config } from '../src/config.js'
import OpenAI from 'openai'

vi.mock('openai')

const SAMPLE_PROMPT = {
  system: 'You are a commit message generator.',
  user: 'Generate a commit for: diff --git a/foo.ts',
}

describe('createProvider — openai', () => {
  beforeEach(() => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'feat(foo): add feature' } }],
    })
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI)
  })

  afterEach(() => vi.clearAllMocks())

  it('throws when apiKey is missing', () => {
    const config: Config = { provider: 'openai', model: 'gpt-4o-mini' }
    expect(() => createProvider(config)).toThrow('OpenAI API key not configured')
  })

  it('generates a commit message', async () => {
    const config: Config = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test' }
    const provider = createProvider(config)
    const result = await provider.generate(SAMPLE_PROMPT)
    expect(result).toBe('feat(foo): add feature')
  })
})

describe('createProvider — anthropic', () => {
  afterEach(() => vi.clearAllMocks())

  it('throws when apiKey is missing', () => {
    const config: Config = { provider: 'anthropic', model: 'claude-3-haiku-20240307' }
    expect(() => createProvider(config)).toThrow('Anthropic API key not configured')
  })

  it('calls Anthropic API and returns message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ content: [{ text: 'fix(auth): fix token bug' }] }),
    }) as unknown as typeof fetch

    const config: Config = { provider: 'anthropic', model: 'claude-3-haiku-20240307', apiKey: 'sk-ant-test' }
    const provider = createProvider(config)
    const result = await provider.generate(SAMPLE_PROMPT)
    expect(result).toBe('fix(auth): fix token bug')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'sk-ant-test' }),
      })
    )
  })
})

describe('createProvider — ollama', () => {
  afterEach(() => vi.clearAllMocks())

  it('does not require an apiKey', () => {
    const config: Config = { provider: 'ollama', model: 'llama3' }
    expect(() => createProvider(config)).not.toThrow()
  })

  it('calls Ollama local endpoint and returns message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ message: { content: 'chore: update deps' } }),
    }) as unknown as typeof fetch

    const config: Config = { provider: 'ollama', model: 'llama3' }
    const provider = createProvider(config)
    const result = await provider.generate(SAMPLE_PROMPT)
    expect(result).toBe('chore: update deps')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('createProvider — unknown provider', () => {
  it('throws for an unknown provider', () => {
    const config = { provider: 'unknown', model: 'x' } as unknown as Config
    expect(() => createProvider(config)).toThrow('Unknown provider: unknown')
  })
})
