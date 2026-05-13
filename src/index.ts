import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
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

  const refs = flags.ref ?? [];
  const output = flags.output?.[0] ?? flags.o?.[0] ?? "";
  const size = flags.size?.[0] ?? flags.s?.[0] ?? "1024x1024";
  const quality = flags.quality?.[0] ?? flags.q?.[0] ?? "medium";
  const n = Number(flags.n?.[0] ?? flags.count?.[0] ?? 1);
  const outputDir = flags["output-dir"]?.[0] ?? flags.d?.[0] ?? ".";

  const hasRefs = refs.length > 0;

  console.log(`${hasRefs ? "Image-to-image" : "Text-to-image"} generation`);
  console.log(`  Model:   gpt-image-2`);
  console.log(`  Prompt:  "${prompt}"`);
  if (hasRefs) console.log(`  Refs:    ${refs.join(", ")}`);
  console.log(`  Size:    ${size}`);
  console.log(`  Quality: ${quality}`);
  console.log(`  Count:   ${n}\n`);

  let resp: OpenAI.Images.ImagesResponse;

  if (hasRefs) {
    // image-to-image via edits endpoint. GPT image models accept up to 16 refs.
    if (refs.length > 16) throw new Error("At most 16 reference images are supported");

    const files = await Promise.all(refs.map(async (refPath, idx) => {
      let image: Buffer;
      let mime = "image/png";
      let name = `reference_${idx}.png`;

      if (refPath.match(/^https?:\/\//)) {
        const res = await fetch(refPath);
        if (!res.ok) throw new Error(`Failed to fetch ref image ${refPath}: ${res.status}`);
        image = Buffer.from(await res.arrayBuffer());
        mime = res.headers.get("content-type")?.split(";")[0] || mime;
        const ext = mime.split("/")[1] || "png";
        name = `reference_${idx}.${ext}`;
      } else if (refPath.startsWith("data:")) {
        const m = refPath.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!m) throw new Error("Unsupported data URI format");
        mime = m[1];
        image = Buffer.from(m[2], "base64");
        name = `reference_${idx}.${mime.split("/")[1] || "png"}`;
      } else {
        if (!existsSync(refPath)) throw new Error(`Reference file not found: ${refPath}`);
        image = readFileSync(refPath);
        const ext = extname(refPath).slice(1).toLowerCase() || "png";
        mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
        name = refPath.split(/[\\/]/).pop() || name;
      }

      // Use the Node.js File API (available in Node 20+) to create a File-like object.
      return new File([new Uint8Array(image)], name, { type: mime });
    }));

    resp = await client.images.edit({
      model: "gpt-image-2",
      image: files as any,
      prompt,
      n,
      size: size as any,
      quality: quality as any,
    });
  } else {
    resp = await client.images.generate({
      model: "gpt-image-2",
      prompt,
      n,
      size: size as any,
      quality: quality as any,
    });
  }

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

  if ((resp as any).usage) console.log(`Tokens: ${JSON.stringify((resp as any).usage)}`);
  return saved;
}

async function cmdBatch(remaining: string[], flags: Record<string, string[]>) {
  const filePath = flags.f?.[0] ?? flags.file?.[0] ?? "";
  const promptsPath = flags.p?.[0] ?? flags.prompts?.[0] ?? "";
  const concurrency = Math.max(1, Number(flags.c?.[0] ?? flags.concurrency?.[0] ?? 3));
  const outputDir = flags.d?.[0] ?? flags["output-dir"]?.[0] ?? ".";
  const size = flags.s?.[0] ?? flags.size?.[0] ?? "1024x1024";
  const quality = flags.q?.[0] ?? flags.quality?.[0] ?? "medium";

  interface Task {
    prompt: string;
    refs?: string[];
    output?: string;
    size?: string;
    quality?: string;
  }

  let tasks: Task[];

  if (filePath) {
    tasks = JSON.parse(readFileSync(filePath, "utf-8"));
  } else if (promptsPath) {
    tasks = readFileSync(promptsPath, "utf-8")
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((p) => ({ prompt: p }));
  } else {
    tasks = remaining.map((p) => ({ prompt: p }));
  }

  if (tasks.length === 0) { console.error("Error: no tasks provided"); process.exit(1); }

  console.log(`Batch: ${tasks.length} tasks, concurrency: ${concurrency}\n`);

  const results: { idx: number; prompt: string; files: string[]; ok: boolean; error?: string }[] = [];
  let active = 0;
  let i = 0;
  let done = 0;

  await new Promise<void>((resolve) => {
    function next() {
      while (active < concurrency && i < tasks.length) {
        const idx = i++;
        const task = tasks[idx];
        active++;

        const taskFlags: Record<string, string[]> = {};
        taskFlags.size = [task.size ?? size];
        taskFlags.quality = [task.quality ?? quality];
        if (task.output) taskFlags.output = [task.output];
        if (task.refs) taskFlags.ref = task.refs;
        taskFlags["output-dir"] = [outputDir];
        taskFlags.n = ["1"];

        const promptParts = task.prompt.split(" ");
        const fakeRemaining = promptParts;

        const p = cmdGenerate(fakeRemaining, taskFlags)
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
      }
    }
    next();
  });

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nDone! ${succeeded} OK, ${failed} failed.`);
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

Generate options:
  -r, --ref <path>      Reference image (repeatable; local file, URL, or data URI)
  -o, --output <path>   Output filename (auto-generated if omitted)
  -s, --size <WxH>      Image size (default: 1024x1024)
  -q, --quality <q>     low | medium | high (default: medium)
  -n, --count <n>       Number of images (default: 1)
  -d, --output-dir <d>  Output directory (default: .)

Batch options:
  -f, --file <path>     JSON array of {prompt, refs?, size?, quality?}
  -p, --prompts <path>  Text file, one prompt per line
  -c, --concurrency <n> Max parallel (default: 3)
  -d, --output-dir <d>  Output directory (default: .)
  -s, --size <WxH>      Default size
  -q, --quality <q>     Default quality

Examples:
  -r, --ref <path>      Reference image (repeatable; local file, URL, or data URI)
  -o, --output <path>   Output filename (auto-generated if omitted)
  -s, --size <WxH>      Image size (default: 1024x1024)
  -q, --quality <q>     low | medium | high (default: medium)
  -n, --count <n>       Number of images (default: 1)
  -d, --output-dir <d>  Output directory (default: .)

Examples:
  npm run dev -- models
  npm run dev -- generate "a red cat on a sunny windowsill"
  npm run dev -- generate -r input.png "make this cat blue"
  npm run dev -- batch "prompt one" "prompt two" "prompt three"
  npm run dev -- batch -f tasks.json -c 3 -d ./output
  npm run dev -- batch -p prompts.txt -c 5`);
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
    case "batch": await cmdBatch(remaining, flags); break;
    default:
      // implicit generate
      await cmdGenerate(raw, {});
  }
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
