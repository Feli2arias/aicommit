const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+$/

export function formatMessage(raw: string): string {
  // Trim leading/trailing whitespace, collapse consecutive newlines to a single space, then truncate to 72 chars
  return raw.trim().replace(/\n+/g, ' ').slice(0, 72)
}

export function isConventionalCommit(message: string): boolean {
  return CONVENTIONAL_COMMIT_REGEX.test(message)
}
