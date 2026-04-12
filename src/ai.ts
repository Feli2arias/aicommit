import OpenAI from 'openai'
import type { Config } from './config.js'

export interface AIProvider {
  generate(prompt: { system: string; user: string }): Promise<string>
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor(apiKey: string, private model: string) {
    this.client = new OpenAI({ apiKey })
  }

  async generate(prompt: { system: string; user: string }): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      max_tokens: 100,
      temperature: 0.3,
    })
    return res.choices[0]?.message?.content ?? ''
  }
}

class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}

  async generate(prompt: { system: string; user: string }): Promise<string> {
    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 100,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.user }],
        }),
      })
    } catch (err) {
      throw new Error(`Anthropic API request failed: ${(err as Error).message}`)
    }
    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`)
    }
    const data = (await res.json()) as { content: Array<{ text: string }> }
    return data.content[0]?.text ?? ''
  }
}

class OllamaProvider implements AIProvider {
  constructor(private model: string) {}

  async generate(prompt: { system: string; user: string }): Promise<string> {
    let res: Response
    try {
      res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
        }),
      })
    } catch (err) {
      throw new Error(`Ollama request failed (is Ollama running?): ${(err as Error).message}`)
    }
    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
    }
    const data = (await res.json()) as { message: { content: string } }
    return data.message?.content ?? ''
  }
}

export function createProvider(config: Config): AIProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) throw new Error('OpenAI API key not configured. Run aicommit to set it up.')
      return new OpenAIProvider(config.apiKey, config.model)
    case 'anthropic':
      if (!config.apiKey) throw new Error('Anthropic API key not configured. Run aicommit to set it up.')
      return new AnthropicProvider(config.apiKey, config.model)
    case 'ollama':
      return new OllamaProvider(config.model)
    default:
      throw new Error(`Unknown provider: ${(config as Config).provider}`)
  }
}
