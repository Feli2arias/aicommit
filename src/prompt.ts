export function buildPrompt(
  diff: string,
  typeHint?: string
): { system: string; user: string } {
  const typeInstruction = typeHint
    ? `You MUST use "${typeHint}" as the commit type.`
    : 'Infer the commit type from the nature of the changes.'

  const system = `You are a git commit message generator. Follow these rules exactly:
- Return ONLY the commit message. No explanation, no markdown, no preamble.
- Format: type(scope): description
- Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Keep the subject line under 72 characters.
- Infer the scope from the file paths changed in the diff.
- ${typeInstruction}`

  const user = `Generate a commit message for the following git diff:\n\n${diff}`

  return { system, user }
}
