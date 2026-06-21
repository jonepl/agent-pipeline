type MissingEntry = {
  readonly name: string;
  readonly reason: string;
};

export function validateEnv(env: Record<string, string | undefined> = process.env): void {
  const missing: MissingEntry[] = [];

  if (!env["CLAUDE_CODE_OAUTH_TOKEN"]) {
    missing.push({
      name: "CLAUDE_CODE_OAUTH_TOKEN",
      reason: "required for agent execution",
    });
  }

  if (env["GH_HOST"] !== "github.com") {
    missing.push({
      name: "GH_HOST",
      reason: "must be set to github.com for gh CLI remote auth",
    });
  }

  if (!env["GITHUB_TOKEN"] && !env["GH_TOKEN"]) {
    missing.push({
      name: "GITHUB_TOKEN or GH_TOKEN",
      reason: "at least one required for gh CLI auth",
    });
  }

  if (missing.length === 0) return;

  const lines = missing.map((m) => `  ${m.name}  — ${m.reason}`);
  throw new Error(
    [
      "Pipeline startup failed: missing required environment variables.",
      "",
      ...lines,
      "",
      "Set them in .sandcastle/.env (see .sandcastle/.env.example).",
    ].join("\n"),
  );
}
