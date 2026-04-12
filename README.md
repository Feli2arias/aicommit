# aicommit

> Generate perfect git commit messages with AI — in 1 second.

## Install

```bash
npm install -g aicommit
```

## Usage

Stage your changes, then run:

```bash
git add .
aicommit
```

You'll see the suggested commit message and choose what to do:

```
? Commit message:
  feat(auth): add JWT refresh token rotation

[y] commit  [n] cancel  [r] regenerate  [e] edit
```

## Flags

| Flag | Description |
|---|---|
| `-y, --yes` | Skip confirmation (CI/CD mode) |
| `--dry-run` | Show message without committing |
| `--type <type>` | Hint the commit type (e.g. `--type fix`) |

## Configuration

On first run, aicommit guides you through setup. Config is saved to `~/.aicommit/config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "apiKey": "sk-..."
}
```

### Providers

| Provider | Default Model | Notes |
|---|---|---|
| `openai` | `gpt-4o-mini` | ~$0.001/commit |
| `anthropic` | `claude-3-haiku-20240307` | Requires API key |
| `ollama` | `llama3` | Local, no API key needed |

### Per-repo config

Add a `.aicommit` file to your repo root to override global settings for your team:

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "apiKey": "sk-..."
}
```

## Requirements

- Node.js >= 18
- git

## License

MIT
