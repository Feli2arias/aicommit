# Contributing to aicommit

## Adding a New AI Provider

1. Open `src/ai.ts`.
2. Create a new class that implements the `AIProvider` interface:

```ts
class MyProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}

  async generate(prompt: { system: string; user: string }): Promise<string> {
    // Call your provider API here and return the raw commit message string
    return ''
  }
}
```

3. Add a new case to the `createProvider` switch in `src/ai.ts`:

```ts
case 'myprovider':
  if (!config.apiKey) throw new Error('MyProvider API key not configured.')
  return new MyProvider(config.apiKey, config.model)
```

4. Add `'myprovider'` to the `Provider` type in `src/config.ts`:

```ts
export type Provider = 'openai' | 'anthropic' | 'ollama' | 'myprovider'
```

5. Update the first-run wizard in `src/index.ts` to include the new provider in the prompt and set its default model.

6. Add tests in `tests/ai.test.ts` following the pattern of the existing provider tests.

## Running Tests

```bash
npm test
npm run test:coverage
```

## Building

```bash
npm run build
```
