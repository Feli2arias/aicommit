import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export type Provider = 'openai' | 'anthropic' | 'ollama'

export interface Config {
  provider: Provider
  model: string
  apiKey?: string
}

const LOCAL_CONFIG_PATH = '.aicommit'

const DEFAULTS: Config = {
  provider: 'openai',
  model: 'gpt-4o-mini',
}

function getGlobalConfigDir(): string {
  return join(homedir(), '.aicommit')
}

function getGlobalConfigPath(): string {
  return join(getGlobalConfigDir(), 'config.json')
}

export function loadConfig(): Config {
  let global: Partial<Config> = {}
  let local: Partial<Config> = {}

  const globalConfigPath = getGlobalConfigPath()
  if (existsSync(globalConfigPath)) {
    global = JSON.parse(readFileSync(globalConfigPath, 'utf8')) as Partial<Config>
  }

  if (existsSync(LOCAL_CONFIG_PATH)) {
    local = JSON.parse(readFileSync(LOCAL_CONFIG_PATH, 'utf8')) as Partial<Config>
  }

  return { ...DEFAULTS, ...global, ...local }
}

export function saveConfig(config: Config): void {
  const globalConfigDir = getGlobalConfigDir()
  const globalConfigPath = getGlobalConfigPath()

  if (!existsSync(globalConfigDir)) {
    mkdirSync(globalConfigDir, { recursive: true })
  }
  writeFileSync(globalConfigPath, JSON.stringify(config, null, 2))
}
