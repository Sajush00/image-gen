import { requestImages } from "../lib/images.js";
import { saveImageResponse } from "../lib/output.js";
import type { CliFlags, GenerateOptions } from "../types.js";

export function getGenerateOptions(remaining: string[], flags: CliFlags): GenerateOptions {
  const prompt = remaining.join(" ");
  if (!prompt) {
    console.error("Error: prompt is required");
    process.exit(1);
  }

  return {
    prompt,
    refs: flags.ref ?? [],
    output: flags.output?.[0] ?? flags.o?.[0] ?? "",
    size: flags.size?.[0] ?? flags.s?.[0] ?? "1024x1024",
    quality: flags.quality?.[0] ?? flags.q?.[0] ?? "medium",
    count: Number(flags.n?.[0] ?? flags.count?.[0] ?? 1),
    outputDir: flags["output-dir"]?.[0] ?? flags.d?.[0] ?? ".",
  };
}

export async function cmdGenerate(remaining: string[], flags: CliFlags) {
  const options = getGenerateOptions(remaining, flags);
  const hasRefs = options.refs.length > 0;

  console.log(`${hasRefs ? "Image-to-image" : "Text-to-image"} generation`);
  console.log(`  Model:   gpt-image-2`);
  console.log(`  Prompt:  "${options.prompt}"`);
  if (hasRefs) console.log(`  Refs:    ${options.refs.join(", ")}`);
  console.log(`  Size:    ${options.size}`);
  console.log(`  Quality: ${options.quality}`);
  console.log(`  Count:   ${options.count}\n`);

  const resp = await requestImages(options);
  const saved = saveImageResponse(resp, options.output, options.outputDir);

  if ((resp as any).usage) console.log(`Tokens: ${JSON.stringify((resp as any).usage)}`);
  return saved;
}
