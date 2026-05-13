export function showHelp() {
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
  npm run dev -- models
  npm run dev -- generate "a red cat on a sunny windowsill"
  npm run dev -- generate -r input.png "make this cat blue"
  npm run dev -- batch "prompt one" "prompt two" "prompt three"
  npm run dev -- batch -f tasks.json -c 3 -d ./output
  npm run dev -- batch -p prompts.txt -c 5`);
}
