import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import type {
  AgentProvider,
  OutputObjectDefinition,
  PromptArgs,
  Sandbox,
  SandboxHooks,
  SandboxRunResult,
} from "@ai-hero/sandcastle";

export type RunAgentOptions = {
  readonly name: string;
  readonly maxIterations: number;
  readonly agent: AgentProvider;
  readonly promptFile: string;
  readonly promptArgs?: PromptArgs;
  readonly hooks?: SandboxHooks;
};

export function runAgent<T>(
  opts: RunAgentOptions & { output: OutputObjectDefinition<T> }
): Promise<SandboxRunResult & { output: T }>;

export function runAgent(
  opts: RunAgentOptions,
  sandbox?: Sandbox
): Promise<SandboxRunResult>;

export async function runAgent<T>(
  opts: RunAgentOptions & { output?: OutputObjectDefinition<T> },
  sandbox?: Sandbox
): Promise<SandboxRunResult & { output?: T }> {
  if (sandbox !== undefined) {
    return sandbox.run({
      name: opts.name,
      maxIterations: opts.maxIterations,
      agent: opts.agent,
      promptFile: opts.promptFile,
      promptArgs: opts.promptArgs,
    });
  }

  if (opts.output !== undefined) {
    return sandcastle.run({
      sandbox: docker(),
      hooks: opts.hooks,
      name: opts.name,
      maxIterations: opts.maxIterations,
      agent: opts.agent,
      promptFile: opts.promptFile,
      promptArgs: opts.promptArgs,
      output: opts.output,
    });
  }

  return sandcastle.run({
    sandbox: docker(),
    hooks: opts.hooks,
    name: opts.name,
    maxIterations: opts.maxIterations,
    agent: opts.agent,
    promptFile: opts.promptFile,
    promptArgs: opts.promptArgs,
  });
}
