# aicommit — Design Document

**Date:** 2026-04-11  
**Status:** Approved

---

## Overview

`aicommit` is a zero-config CLI tool that reads the staged git diff and generates a semantic commit message using AI, then asks for confirmation before committing. It supports OpenAI, Anthropic, and Ollama as providers and follows the Conventional Commits specification by default. Distributed as an npm package.

---

## Architecture

Monolito modular — un solo paquete npm con 6 módulos bajo `src/`, compilado a `dist/` con `tsup`.

```
aicommit/
├── src/
│   ├── index.ts          # Entrypoint: flags, flujo principal, I/O
│   ├── git.ts            # Lee staged diff vía child_process
│   ├── ai.ts             # Strategy pattern: OpenAI / Anthropic / Ollama
│   ├── config.ts         # Lee ~/.aicommit/config.json + .aicommit local
│   ├── prompt.ts         # Construye el system + user prompt
│   └── formatter.ts      # Limpia y valida el output del AI
├── tests/
│   ├── git.test.ts
│   ├── formatter.test.ts
│   ├── config.test.ts
│   └── prompt.test.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

**Stack:**
- Language: TypeScript, compiled to JS via `tsup`
- Runtime: Node.js >= 18
- CLI framework: `commander`
- Tests: Vitest
- Distribution: npm publish + GitHub Releases

---

## CLI Interface

```
aicommit [options]
  --yes, -y         Skip confirmation (CI/CD mode)
  --dry-run         Show suggested message without committing
  --type <type>     Hint commit type (feat, fix, chore, etc.)
```

---

## Core Flow

1. Load config (global `~/.aicommit/config.json` → local `.aicommit`, local wins)
2. If no `apiKey` in config → run first-use wizard (prompt provider → apiKey → save)
3. Run `git diff --cached` to get staged diff
4. If diff is empty → exit with error: `"No staged changes. Run git add first."`
5. If diff exceeds ~3000 tokens → truncate with warning
6. Call AI provider with system + user prompt
7. Display generated message and prompt user:
   ```
   ? Commit message:
     feat(auth): add JWT refresh token rotation

   [y] commit  [n] cancel  [r] regenerate  [e] edit
   ```
8. `y` → run `git commit -m "..."` and exit  
   `r` → go back to step 6  
   `e` → open inline editor, then commit  
   `n` → exit without committing

**Flags override:**
- `--yes` skips step 7 and commits immediately
- `--dry-run` prints the message and exits 0 without committing

---

## Configuration

**Global config:** `~/.aicommit/config.json`

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "apiKey": "sk-..."
}
```

**Project-level override:** `.aicommit` file in repo root (same format). Project config wins over global.

**First-run wizard:** if no config exists, the CLI guides the user through provider and API key setup, then saves to `~/.aicommit/config.json`.

---

## AI Providers

All three providers implement the same internal interface:

```ts
interface AIProvider {
  generate(prompt: string): Promise<string>
}
```

| Provider | Endpoint | Auth |
|---|---|---|
| `openai` | Official `openai` SDK | `apiKey` in config |
| `anthropic` | HTTP to `api.anthropic.com` | `x-api-key` header |
| `ollama` | HTTP to `localhost:11434` | No auth required |

Default provider: `openai`. Default model: `gpt-4o-mini` (~$0.001/commit).

---

## Prompt Contract

The system prompt instructs the model to:

- Return only the commit message — no explanation, no markdown, no preamble
- Use Conventional Commits format: `type(scope): description`
- Keep the subject line under 72 characters
- Infer scope from the file paths present in the diff
- If `--type` flag is provided, force that commit type

---

## Testing

**Framework:** Vitest  
**Minimum coverage:** 80%

| Module | What to test |
|---|---|
| `git.ts` | Throws when no staged changes; returns diff string correctly |
| `formatter.ts` | Strips extra whitespace; validates Conventional Commits format |
| `config.ts` | Local config wins over global; handles missing file gracefully |
| `prompt.ts` | Output contains diff content; respects `--type` hint; snapshot for regression |

- `child_process` is mocked in `git.ts` tests — no real git repo needed
- OpenAI SDK and `fetch` are mocked in `ai.ts` tests — no real API calls

---

## Out of Scope (MVP)

- GUI or web interface
- Automatic `git push`
- Multi-language commit messages (English only)
- GitHub/GitLab PR description generation
- IDE integrations
- Billing or team management

---

## MVP Launch Criteria

1. `npm install -g aicommit` works on macOS, Linux, and Windows
2. Core flow (`git add` → `aicommit` → confirm → commit) works end-to-end
3. First-run API key setup wizard works
4. README includes GIF demo and copy-paste install instructions
