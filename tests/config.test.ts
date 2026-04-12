import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadConfig, saveConfig } from '../src/config.js'
import type { Config } from '../src/config.js'
import * as fs from 'fs'
import * as os from 'os'

vi.mock('fs')
vi.mock('os')

const mockOs = vi.mocked(os)
const mockFs = vi.mocked(fs)

beforeEach(() => {
  mockOs.homedir.mockReturnValue('/home/testuser')
  mockFs.existsSync.mockReturnValue(false)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('loadConfig', () => {
  it('returns defaults when no config files exist', () => {
    const config = loadConfig()
    expect(config).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
    })
  })

  it('reads global config when present', () => {
    mockFs.existsSync.mockImplementation((p) => p === '/home/testuser/.aicommit/config.json')
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ provider: 'anthropic', model: 'claude-3-haiku-20240307', apiKey: 'sk-ant-test' })
    )
    const config = loadConfig()
    expect(config.provider).toBe('anthropic')
    expect(config.apiKey).toBe('sk-ant-test')
  })

  it('local .aicommit overrides global config', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync
      .mockReturnValueOnce(JSON.stringify({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-global' }))
      .mockReturnValueOnce(JSON.stringify({ provider: 'ollama', model: 'llama3' }))
    const config = loadConfig()
    expect(config.provider).toBe('ollama')
    expect(config.model).toBe('llama3')
    expect(config.apiKey).toBe('sk-global')
  })

  it('handles missing config file gracefully', () => {
    mockFs.existsSync.mockReturnValue(false)
    expect(() => loadConfig()).not.toThrow()
  })
})

describe('saveConfig', () => {
  it('creates config directory if it does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)
    const config: Config = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test' }
    saveConfig(config)
    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/home/testuser/.aicommit', { recursive: true })
  })

  it('writes config as formatted JSON', () => {
    mockFs.existsSync.mockReturnValue(true)
    const config: Config = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test' }
    saveConfig(config)
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/home/testuser/.aicommit/config.json',
      JSON.stringify(config, null, 2)
    )
  })
})
