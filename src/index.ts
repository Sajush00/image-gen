import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.IMAGE_GEN_BASE_URL ?? "http://localhost:8317/v1",
  apiKey: process.env.IMAGE_GEN_API_KEY ?? "p",
});

// ── CLI helpers ──────────────────────────────────────────────────────────

/** Parses flags like -x value or --flag value from args, returns remaining positional args. */
function parseFlags(args: string[], defs: Record<string, { alias?: string; count?: number }>) {
  const flags: Record<string, string[]> = {};
  const remaining: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    let matched: string | null = null;
    for (const [name, def] of Object.entries(defs)) {
      if (a === `-${def.alias ?? name}` || a === `--${name}` || (name.length === 1 && a.startsWith("-") && !a.startsWith("--") && a.includes(name))) {
        matched = name;
        break;
      }
    }
    if (matched) {
      const n = defs[matched].count ?? 1;
      const vals: string[] = [];
      for (let j = 0; j < n && i + 1 + j < args.length; j++) {
        vals.push(args[i + 1 + j]);
      }
      flags[matched] = [...(flags[matched] ?? []), ...vals];
      i += n;
    } else {
      remaining.push(a);
    }
  }
  return { flags, remaining };
}

// ── Commands ─────────────────────────────────────────────────────────────

async function cmdGenerate(remaining: string[], flags: Record<string, string[]>) {
  const prompt = remaining.join(" ");
  if (!prompt) { console.error("Error: prompt is required"); process.exit(1); }

  const output = flags.output?.[0] ?? flags.o?.[0] ?? "";
  const size = flags.size?.[0] ?? flags.s?.[0] ?? "1024x1024";
  const quality = flags.quality?.[0] ?? flags.q?.[0] ?? "medium";
  const n = Number(flags.n?.[0] ?? flags.count?.[0] ?? 1);
  const outputDir = flags["output-dir"]?.[0] ?? flags.d?.[0] ?? ".";

  console.log(`Text-to-image generation`);
  console.log(`  Model:   gpt-image-2`);
  console.log(`  Prompt:  "${prompt}"`);
  console.log(`  Size:    ${size}`);
  console.log(`  Quality: ${quality}`);
  console.log(`  Count:   ${n}\n`);

  const resp = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    n,
    size: size as any,
    quality: quality as any,
  });

  const saved: string[] = [];
  for (let i = 0; i < resp.data.length; i++) {
    const item = resp.data[i];
    if (item.revised_prompt) console.log(`\nRevised prompt: "${item.revised_prompt}"`);

    if (item.b64_json) {
      const buf = Buffer.from(item.b64_json, "base64");
      const fname = (output && resp.data.length === 1) ? output : resolve(outputDir, `generated_${Date.now()}_${i}.png`);
      mkdirSync(dirname(fname), { recursive: true });
      writeFileSync(fname, buf);
      saved.push(fname);
      console.log(`Saved: ${fname}  (${(buf.length / 1024).toFixed(1)} KB)`);
    } else if (item.url) {
      console.log(`URL: ${item.url}`);
      saved.push(item.url);
    }
  }

  if ((resp as any).usage) console.log(`Tokens: ${JSON.stringify((resp as any).usage)}`);
  return saved;
}

async function cmdListModels() {
  const resp = await client.models.list();
  console.log("Available models:\n");
  for (const m of resp.data) {
    console.log(`  ${m.id.padEnd(24)} (owned_by: ${m.owned_by})`);
  }
  const img = resp.data.filter((m) => m.id.toLowerCase().includes("image"));
  console.log(`\nImage models: ${img.map((m) => m.id).join(", ") || "(none)"}`);
}

// ── Main ─────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`image-gen — OpenAI-compatible image generation CLI

Config: .env file or env vars:
  IMAGE_GEN_BASE_URL   API base URL  (default: http://localhost:8317/v1)
  IMAGE_GEN_API_KEY    API key       (default: p)

Commands:
  list-models | models          List available models
  generate | gen [opts] <prompt>
                                Generate images from text prompt
  batch [opts]                  Generate multiple images in parallel

Examples:
  npm run dev -- models
  npm run dev -- generate "a red cat on a sunny windowsill"
  npm run dev -- batch "prompt one" "prompt two" "prompt three"`);
}

async function main() {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] === "help" || raw[0] === "--help" || raw[0] === "-h") {
    showHelp();
    return;
  }

  const cmd = raw[0];
  const rest = raw.slice(1);

  const flagDefs: Record<string, { alias?: string; count?: number }> = {
    ref: { alias: "r" }, output: { alias: "o" }, size: { alias: "s" },
    quality: { alias: "q" }, n: { count: 1 }, count: {}, "output-dir": { alias: "d" },
    f: {}, file: {}, p: {}, prompts: {}, c: {}, concurrency: {},
  };

  const { flags, remaining } = parseFlags(rest, flagDefs);

  switch (cmd) {
    case "list-models": case "models": await cmdListModels(); break;
    case "generate": case "gen": await cmdGenerate(remaining, flags); break;
    case "batch": console.log("batch (coming soon)"); break;
    default:
      // implicit generate
      await cmdGenerate(raw, {});
  }
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
