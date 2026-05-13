import { readFileSync } from "node:fs";
import { cmdGenerate } from "./generate.js";
import type { BatchOptions, BatchResult, BatchTask, GenerateOptions } from "../types.js";

export async function cmdBatch(promptArgs: string[], options: BatchOptions) {
  let tasks: BatchTask[];

  if (options.file) {
    tasks = JSON.parse(readFileSync(options.file, "utf-8"));
  } else if (options.prompts) {
    tasks = readFileSync(options.prompts, "utf-8")
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((p) => ({ prompt: p }));
  } else {
    tasks = promptArgs.map((p) => ({ prompt: p }));
  }

  if (tasks.length === 0) {
    console.error("Error: no tasks provided");
    process.exit(1);
  }

  console.log(`Batch: ${tasks.length} tasks, concurrency: ${options.concurrency}\n`);

  const results: BatchResult[] = [];
  let active = 0;
  let i = 0;
  let done = 0;

  await new Promise<void>((resolve) => {
    function next() {
      while (active < options.concurrency && i < tasks.length) {
        const idx = i++;
        const task = tasks[idx];
        active++;

        const generateOptions: GenerateOptions = {
          prompt: task.prompt,
          refs: task.refs ?? [],
          output: task.output ?? "",
          size: task.size ?? options.size,
          quality: task.quality ?? options.quality,
          count: 1,
          outputDir: options.outputDir,
        };

        const p = cmdGenerate(generateOptions)
          .then((files) => { results[idx] = { idx, prompt: task.prompt, files, ok: true }; })
          .catch((err: Error) => { results[idx] = { idx, prompt: task.prompt, files: [], ok: false, error: err.message }; })
          .finally(() => {
            done++;
            active--;
            const r = results[idx];
            console.log(`[${done}/${tasks.length}] ${task.prompt.slice(0, 60)}${task.prompt.length > 60 ? "..." : ""} ${r.ok ? "OK" : `FAILED: ${r.error}`}`);
            if (done >= tasks.length) resolve();
            else next();
          });
        void p;
      }
    }
    next();
  });

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nDone! ${succeeded} OK, ${failed} failed.`);
}
