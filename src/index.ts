import { loadConfig } from "./config.js";
import { startPoll } from "./poll.js";

const config = await loadConfig();

console.log(
  `[pipeline] starting — poll interval ${config.pollIntervalMs}ms, K=${config.K}`,
);

const handle = startPoll(config);

function shutdown(): void {
  console.log("[pipeline] shutting down — waiting for current cycle to finish...");
  handle.stop();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await handle.done;

console.log("[pipeline] stopped.");
