import { requestImages } from "../lib/images.js";
import { saveImageResponse } from "../lib/output.js";
import type { GenerateOptions } from "../types.js";

export async function cmdGenerate(options: GenerateOptions) {
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
