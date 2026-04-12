import { program } from 'commander'
import * as readline from 'readline'
import { loadConfig, saveConfig } from './config.js'
import type { Config, Provider } from './config.js'
import { getStagedDiff, truncateDiff, commitWithMessage } from './git.js'
import { formatMessage, isConventionalCommit } from './formatter.js'
import { buildPrompt } from './prompt.js'
import { createProvider } from './ai.js'

program
  .name('aicommit')
  .description('Generate git commit messages with AI')
  .version('0.1.0')
  .option('-y, --yes', 'Skip confirmation and commit immediately')
  .option('--dry-run', 'Show message without committing')
  .option('--type <type>', 'Hint the commit type (feat, fix, chore, etc.)')
  .action(async (opts: { yes?: boolean; dryRun?: boolean; type?: string }) => {
    try {
      await run(opts)
    } catch (err) {
      console.error(`\n✗ ${(err as Error).message}`)
      process.exit(1)
    }
  })

program.parse()

class RegenerateSignal extends Error {
  constructor() {
    super('regenerate')
  }
}

async function run(opts: { yes?: boolean; dryRun?: boolean; type?: string }): Promise<void> {
  let config = loadConfig()

  if (!config.apiKey && config.provider !== 'ollama') {
    config = await runWizard(config)
  }

  const raw = getStagedDiff()
  const diff = truncateDiff(raw)
  const prompt = buildPrompt(diff, opts.type)
  const provider = createProvider(config)

  while (true) {
    const rawMsg = await provider.generate(prompt)
    const message = formatMessage(rawMsg)

    if (!isConventionalCommit(message)) {
      console.warn('⚠  Message does not follow Conventional Commits — using as-is')
    }

    if (opts.dryRun) {
      console.log(`\n${message}\n`)
      return
    }

    if (opts.yes) {
      commitWithMessage(message)
      console.log(`\n✓ Committed: ${message}`)
      return
    }

    try {
      await promptUser(message)
      return
    } catch (err) {
      if (err instanceof RegenerateSignal) continue
      throw err
    }
  }
}

async function promptUser(initial: string): Promise<void> {
  let message = initial
  while (true) {
    console.log(`\n? Commit message:\n  ${message}\n`)
    process.stdout.write('[y] commit  [n] cancel  [r] regenerate  [e] edit\n> ')

    const key = await readKey()
    console.log(key)

    if (key === 'y') {
      commitWithMessage(message)
      console.log(`\n✓ Committed: ${message}`)
      return
    } else if (key === 'n') {
      console.log('\n✗ Cancelled.')
      process.exit(0)
    } else if (key === 'r') {
      console.log('\n↻ Regenerating...')
      throw new RegenerateSignal()
    } else if (key === 'e') {
      message = await promptEdit(message)
    }
  }
}

async function readKey(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', (data: string) => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      const key = data.toLowerCase()
      if (key === '\u0003') process.exit(0)
      resolve(key)
    })
  })
}

async function promptEdit(current: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    process.stdout.write(`\nEdit message (leave blank to keep current):\n> `)
    rl.once('line', (answer) => {
      rl.close()
      resolve(answer.trim() || current)
    })
  })
}

async function runWizard(config: Config): Promise<Config> {
  console.log("\n👋 Welcome to aicommit! Let's set up your AI provider.\n")
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve))

  const providerInput = await ask('Provider [openai/anthropic/ollama] (default: openai): ')
  const provider = (['openai', 'anthropic', 'ollama'].includes(providerInput)
    ? providerInput
    : 'openai') as Provider

  let model =
    provider === 'openai' ? 'gpt-4o-mini'
    : provider === 'anthropic' ? 'claude-3-haiku-20240307'
    : 'llama3'

  const modelInput = await ask(`Model (default: ${model}): `)
  if (modelInput.trim()) model = modelInput.trim()

  let apiKey: string | undefined
  if (provider !== 'ollama') {
    const keyInput = await ask('API Key: ')
    if (!keyInput.trim()) {
      rl.close()
      throw new Error('API key is required for this provider.')
    }
    apiKey = keyInput.trim()
  }

  rl.close()

  const newConfig: Config = { provider, model, ...(apiKey ? { apiKey } : {}) }
  saveConfig(newConfig)
  console.log('\n✓ Config saved to ~/.aicommit/config.json\n')
  return newConfig
}
