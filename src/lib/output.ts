import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type OpenAI from "openai";

export function saveImageResponse(resp: OpenAI.Images.ImagesResponse, output: string, outputDir: string) {
  const saved: string[] = [];
  const data = resp.data ?? [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.revised_prompt) console.log(`\nRevised prompt: "${item.revised_prompt}"`);

    if (item.b64_json) {
      const buf = Buffer.from(item.b64_json, "base64");
      const fname = (output && data.length === 1) ? output : resolve(outputDir, `generated_${Date.now()}_${i}.png`);
      mkdirSync(dirname(fname), { recursive: true });
      writeFileSync(fname, buf);
      saved.push(fname);
      console.log(`Saved: ${fname}  (${(buf.length / 1024).toFixed(1)} KB)`);
    } else if (item.url) {
      console.log(`URL: ${item.url}`);
      saved.push(item.url);
    }
  }

  return saved;
}
