import { cmdBatch } from "../commands/batch.js";
import { cmdGenerate } from "../commands/generate.js";
import { cmdListModels } from "../commands/models.js";
import { parseFlags } from "./flags.js";
import { showHelp } from "./help.js";

export async function main() {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] === "help" || raw[0] === "--help" || raw[0] === "-h") {
    showHelp();
    return;
  }

  const cmd = raw[0];
  const rest = raw.slice(1);

  const flagDefs = {
    ref: { alias: "r" }, output: { alias: "o" }, size: { alias: "s" },
    quality: { alias: "q" }, n: { count: 1 }, count: {}, "output-dir": { alias: "d" },
    f: {}, file: {}, p: {}, prompts: {}, c: {}, concurrency: {},
  };

  const { flags, remaining } = parseFlags(rest, flagDefs);

  switch (cmd) {
    case "list-models": case "models": await cmdListModels(); break;
    case "generate": case "gen": await cmdGenerate(remaining, flags); break;
    case "batch": await cmdBatch(remaining, flags); break;
    default:
      await cmdGenerate(raw, {});
  }
}
