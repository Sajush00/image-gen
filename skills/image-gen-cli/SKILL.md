---
name: image-gen-cli
description: Generate images with gpt-image-2 via OpenAI-compatible API. Supports text-to-image, image-to-image (reference images), and parallel batch generation with concurrency limits. Use when the user asks to generate, edit, or batch images.
---

# image-gen CLI Skill

CLI for generating images with the `gpt-image-2` model via an OpenAI-compatible API.

## Setup

Work from the repository root:

```bash
cd path/to/image-gen
```

Ensure the API is running at `localhost:8317/v1`. Config lives in `.env`:

```env
IMAGE_GEN_BASE_URL=http://localhost:8317/v1
IMAGE_GEN_API_KEY=p
```

Install deps (first time only):

```bash
npm install
```

## Quick start

```bash
# List available models
npm run dev -- models

# Generate one image
npm run dev -- generate "a friendly orange fox reading a book in a cozy armchair"

# Generate with low quality (fast drafts)
npm run dev -- generate -q low "concept sketch of a spaceship"
```

## CLI reference

### Commands

| Command | Alias | Purpose |
|---------|-------|---------|
| `models` | `list-models` | List available models |
| `generate` | `gen` | Single image generation |
| `batch` | — | Parallel multi-prompt generation |

### Generate options

```
-q, --quality <low|medium|high>    default: medium
-s, --size <WxH>                   default: 1024x1024
-n, --count <n>                    default: 1
-r, --ref <path>                   Reference image (repeatable; local file, URL, or data URI; up to 16)
-o, --output <path>                Output file path
-d, --output-dir <dir>             Output directory (default: .)
```

### Batch options

```
-f, --file <path>                  JSON array of task objects
-p, --prompts <path>               Text file, one prompt per line
-c, --concurrency <n>              Max parallel requests (default: 3)
-d, --output-dir <dir>             Output directory (default: .)
-s, --size <WxH>                   Default size for all tasks
-q, --quality <low|medium|high>    Default quality for all tasks
```

Positional args after flags are treated as prompts (one per task).

## Common patterns

### Text-to-image

```bash
# Simple generation
npm run dev -- generate "a watercolor painting of a lighthouse at sunset"

# Landscape, high quality
npm run dev -- generate -s 1536x1024 -q high "majestic mountain range with eagles"

# Portrait, multiple outputs
npm run dev -- generate -s 1024x1536 -n 2 "fashion illustration of a winter coat"

# Custom output path
npm run dev -- generate -o ./results/hero.png "a hero banner for a tech blog"
```

### Image-to-image (references)

One or more reference images are sent to the edits endpoint; the prompt describes the desired edit/composition. Repeat `-r` for multiple references (up to 16).

```bash
# Edit a local image
npm run dev -- generate -r input.png "make the sky sunset orange"

# Reference from a URL
npm run dev -- generate -r https://example.com/photo.jpg "turn into oil painting"

# Reference multiple images
npm run dev -- generate -r ref1.png -r ref2.png "blend these two styles"
```

**How it works:** The CLI detects `-r` and switches from `/v1/images/generations` to `/v1/images/edits` (multipart form upload). Multiple refs are uploaded as an array in the `image` field. Supported ref inputs: local file paths, HTTP(S) URLs, and `data:image/...;base64,...` URIs.

### Batch generation

```bash
# Inline prompts, 3 at a time
npm run dev -- batch -c 3 "a red car" "a blue boat" "a green plane" "a yellow bike" "a purple train"

# From a text file (one prompt per line)
echo "a cozy cabin in snow" > prompts.txt
echo "a beach at sunrise" >> prompts.txt
npm run dev -- batch -p prompts.txt -c 2 -d ./output

# From a JSON file with per-task settings
npm run dev -- batch -f tasks.json -c 3 -d ./output
```

**tasks.json format:**

```json
[
  {
    "prompt": "a red sports car on a coastal highway",
    "size": "1536x1024",
    "quality": "high",
    "output": "./output/car.png"
  },
  {
    "prompt": "turn this sketch into a digital painting",
    "refs": ["./sketch.png", "./style-reference.jpg"],
    "quality": "medium"
  },
  {
    "prompt": "a minimalist logo of a mountain"
  }
]
```

Fields: `prompt` (required), `refs` (optional string array), `output` (optional path), `size` (optional), `quality` (optional).

### Drafts and iteration

```bash
# Fast low-quality drafts for brainstorming
npm run dev -- generate -q low "UI mockup: dashboard with charts"

# Batch draft exploration
npm run dev -- batch -q low -c 3 -d ./drafts \
  "steampunk airship" \
  "cyberpunk street market" \
  "solar-punk treehouse city" \
  "diesel-punk armored train" \
  "biopunk laboratory"
```

## Sizes

Common sizes accepted by the API:

| Name | Dimensions | Notes |
|------|-----------|-------|
| Square | `1024x1024` | Fastest |
| Landscape | `1536x1024` | |
| Portrait | `1024x1536` | |
| 2K Square | `2048x2048` | Experimental |
| 2K Landscape | `2048x1152` | Experimental |
| 4K Landscape | `3840x2160` | Experimental, max quality |

## Notes

- Minimum pixel budget enforced — sizes smaller than ~256x256 are rejected.
- `low` quality is ~10x faster and cheaper than `medium`; use for drafts and iteration.
- Reference images must be PNG, JPEG, or WebP.
- The API returns base64-encoded PNG data in `data[].b64_json`.
- Batch concurrency defaults to 3; increasing beyond 3 may hit rate limits depending on the server.
