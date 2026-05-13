import { Command } from "commander";
import { cmdBatch } from "../commands/batch.js";
import { cmdGenerate } from "../commands/generate.js";
import { cmdListModels } from "../commands/models.js";
import type { BatchOptions, GenerateOptions } from "../types.js";

function collect(value: string, previous: string[]) {
  previous.push(value);
  return previous;
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, got: ${value}`);
  }
  return parsed;
}

export async function main(argv = process.argv) {
  const program = new Command();

  program
    .name("image-gen")
    .description("OpenAI-compatible image generation CLI for agent workflows")
    .version("1.0.0")
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command("models")
    .alias("list-models")
    .description("List available models")
    .action(async () => {
      await cmdListModels();
    });

  program
    .command("generate")
    .alias("gen")
    .description("Generate images from a text prompt")
    .argument("<prompt...>", "prompt text")
    .option("-r, --ref <path>", "reference image path, URL, or data URI", collect, [])
    .option("-o, --output <path>", "output filename", "")
    .option("-s, --size <WxH>", "image size", "1024x1024")
    .option("-q, --quality <quality>", "low, medium, or high", "medium")
    .option("-n, --count <n>", "number of images", parsePositiveInt, 1)
    .option("-d, --output-dir <dir>", "output directory", ".")
    .action(async (promptParts: string[], opts) => {
      const options: GenerateOptions = {
        prompt: promptParts.join(" "),
        refs: opts.ref,
        output: opts.output,
        size: opts.size,
        quality: opts.quality,
        count: opts.count,
        outputDir: opts.outputDir,
      };
      await cmdGenerate(options);
    });

  program
    .command("batch")
    .description("Generate multiple images in parallel")
    .argument("[prompts...]", "inline prompts, one image per prompt")
    .option("-f, --file <path>", "JSON array of task objects")
    .option("-p, --prompts <path>", "text file, one prompt per line")
    .option("-c, --concurrency <n>", "max parallel requests", parsePositiveInt, 3)
    .option("-d, --output-dir <dir>", "output directory", ".")
    .option("-s, --size <WxH>", "default image size", "1024x1024")
    .option("-q, --quality <quality>", "default quality", "medium")
    .action(async (prompts: string[], opts) => {
      const options: BatchOptions = {
        file: opts.file,
        prompts: opts.prompts,
        concurrency: opts.concurrency,
        outputDir: opts.outputDir,
        size: opts.size,
        quality: opts.quality,
      };
      await cmdBatch(prompts, options);
    });

  await program.parseAsync(argv);
}
