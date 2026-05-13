import { readFileSync } from "node:fs";
import { cmdGenerate } from "./generate.js";
import type { BatchResult, BatchTask, CliFlags } from "../types.js";

export async function cmdBatch(remaining: string[], flags: CliFlags) {
  const filePath = flags.f?.[0] ?? flags.file?.[0] ?? "";
  const promptsPath = flags.p?.[0] ?? flags.prompts?.[0] ?? "";
  const concurrency = Math.max(1, Number(flags.c?.[0] ?? flags.concurrency?.[0] ?? 3));
  const outputDir = flags.d?.[0] ?? flags["output-dir"]?.[0] ?? ".";
  const size = flags.s?.[0] ?? flags.size?.[0] ?? "1024x1024";
  const quality = flags.q?.[0] ?? flags.quality?.[0] ?? "medium";

  let tasks: BatchTask[];

  if (filePath) {
    tasks = JSON.parse(readFileSync(filePath, "utf-8"));
  } else if (promptsPath) {
    tasks = readFileSync(promptsPath, "utf-8")
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((p) => ({ prompt: p }));
  } else {
    tasks = remaining.map((p) => ({ prompt: p }));
  }

  if (tasks.length === 0) {
    console.error("Error: no tasks provided");
    process.exit(1);
  }

  console.log(`Batch: ${tasks.length} tasks, concurrency: ${concurrency}\n`);

  const results: BatchResult[] = [];
  let active = 0;
  let i = 0;
  let done = 0;

  await new Promise<void>((resolve) => {
    function next() {
      while (active < concurrency && i < tasks.length) {
        const idx = i++;
        const task = tasks[idx];
        active++;

        const taskFlags: CliFlags = {
          size: [task.size ?? size],
          quality: [task.quality ?? quality],
          "output-dir": [outputDir],
          n: ["1"],
        };
        if (task.output) taskFlags.output = [task.output];
        if (task.refs) taskFlags.ref = task.refs;

        const p = cmdGenerate(task.prompt.split(" "), taskFlags)
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
