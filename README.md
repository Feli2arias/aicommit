<div align="center">

# ⚡ aicommit

**Generate perfect git commit messages with AI — in 1 second.**

[![npm version](https://img.shields.io/npm/v/aicommit?color=brightgreen&style=flat-square)](https://www.npmjs.com/package/aicommit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

```
git add .
aicommit
```

```
? Commit message:
  feat(auth): add JWT refresh token rotation

[y] commit  [n] cancel  [r] regenerate  [e] edit
```

</div>

---

## Why aicommit?

Every developer writes commit messages dozens of times a week. Most are vague ("fix", "wip", "changes"), inconsistent, or take too long to write properly.

**aicommit reads your staged diff and generates a semantic, Conventional Commits message in one command.** Zero config. Works with OpenAI, Anthropic, or local Ollama models.

## Install

```bash
npm install -g aicommit
```

## Usage

```bash
git add .
aicommit
```

On first run, aicommit walks you through setup (provider + API key). After that, one command is all you need.

## Flags

| Flag | Description |
|---|---|
| `-y, --yes` | Skip confirmation — commit immediately (great for CI/CD) |
| `--dry-run` | Show the suggested message without committing |
| `--type <type>` | Hint the commit type: `--type fix`, `--type feat`, etc. |

**Examples:**

```bash
# Preview without committing
aicommit --dry-run

# Auto-confirm in pipelines
aicommit --yes

# Guide the AI toward a specific type
aicommit --type fix
```

## Providers

| Provider | Default Model | Cost | Notes |
|---|---|---|---|
| `openai` | `gpt-4o-mini` | ~$0.001/commit | Fast, cheap, great quality |
| `anthropic` | `claude-3-haiku-20240307` | ~$0.001/commit | Excellent reasoning |
| `ollama` | `llama3` | Free | 100% local, no API key needed |

## Configuration

Config is stored at `~/.aicommit/config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "apiKey": "sk-..."
}
```

### Per-repo config

Drop a `.aicommit` file in your repo root to enforce a consistent setup across your team:

```json
{
  "provider": "openai",
  "model": "gpt-4o"
}
```

Project-level config always wins over the global one.

## How it works

1. Reads your staged diff with `git diff --cached`
2. Sends the diff to your chosen AI provider with a strict prompt
3. The AI returns a single Conventional Commits message
4. You confirm, edit, regenerate, or cancel — then it commits

The prompt enforces:
- Conventional Commits format: `type(scope): description`
- Subject line under 72 characters
- Scope inferred from changed file paths
- No markdown, no explanation — just the commit message

## Requirements

- Node.js ≥ 18
- git

## Contributing

Want to add a new AI provider? See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
