import { describe, it, expect } from "vitest";
import { validateEnv } from "../validateEnv.js";

const validEnv = {
  CLAUDE_CODE_OAUTH_TOKEN: "tok_abc123",
  GH_HOST: "github.com",
  GITHUB_TOKEN: "ghp_abc123",
};

describe("validateEnv", () => {
  it("passes when all required vars are present", () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it("accepts GH_TOKEN in place of GITHUB_TOKEN", () => {
    const env = { ...validEnv, GITHUB_TOKEN: undefined, GH_TOKEN: "ghp_abc123" };
    expect(() => validateEnv(env)).not.toThrow();
  });

  it("throws when CLAUDE_CODE_OAUTH_TOKEN is missing and names it", () => {
    const env = { ...validEnv, CLAUDE_CODE_OAUTH_TOKEN: undefined };
    expect(() => validateEnv(env)).toThrow("CLAUDE_CODE_OAUTH_TOKEN");
  });

  it("throws when GH_HOST is not github.com and names it", () => {
    const env = { ...validEnv, GH_HOST: undefined };
    expect(() => validateEnv(env)).toThrow("GH_HOST");
  });

  it("throws when GH_HOST is set to a wrong value and names it", () => {
    const env = { ...validEnv, GH_HOST: "enterprise.example.com" };
    expect(() => validateEnv(env)).toThrow("GH_HOST");
  });

  it("throws when neither GITHUB_TOKEN nor GH_TOKEN is present and names both", () => {
    const env = { ...validEnv, GITHUB_TOKEN: undefined, GH_TOKEN: undefined };
    expect(() => validateEnv(env)).toThrow("GITHUB_TOKEN or GH_TOKEN");
  });

  it("collects all missing vars before throwing — does not stop at the first", () => {
    const env: Record<string, string | undefined> = {
      CLAUDE_CODE_OAUTH_TOKEN: undefined,
      GH_HOST: undefined,
      GITHUB_TOKEN: undefined,
      GH_TOKEN: undefined,
    };
    expect(() => validateEnv(env)).toThrow(
      /CLAUDE_CODE_OAUTH_TOKEN[\s\S]*GH_HOST[\s\S]*GITHUB_TOKEN or GH_TOKEN/,
    );
  });

  it("error message points to .env.example", () => {
    const env = { ...validEnv, CLAUDE_CODE_OAUTH_TOKEN: undefined };
    expect(() => validateEnv(env)).toThrow(".env.example");
  });
});
