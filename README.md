# image-gen

CLI for generating images via an OpenAI-compatible API. Supports text-to-image, image-to-image (reference images), and parallel batch generation.

## Install

```bash
npm install
```

Copy `.env.example` to `.env` and configure your API endpoint:

```bash
cp .env.example .env
```

## Usage

```bash
# List available models
npm run dev -- models

# Generate an image from text
npm run dev -- generate "a red cat on a sunny windowsill"

# Image-to-image with reference
npm run dev -- generate -r input.png "make this cat blue"

# Batch generation (3 concurrent)
npm run dev -- batch -c 3 -d ./output "prompt one" "prompt two" "prompt three"

# Batch from a JSON task file
npm run dev -- batch -f tasks.json -c 3 -d ./output

# Batch from a text file (one prompt per line)
npm run dev -- batch -p prompts.txt -c 5 -d ./output
```

## Commands

| Command     | Alias       | Purpose                              |
|-------------|-------------|--------------------------------------|
| `models`    | `list-models` | List available models             |
| `generate`  | `gen`       | Single image generation              |
| `batch`     | —           | Parallel multi-prompt generation     |

## Generate Options

| Flag              | Alias | Description                                      |
|-------------------|-------|--------------------------------------------------|
| `-r, --ref <path>` |       | Reference image (repeatable; file, URL, data URI) |
| `-o, --output <path>` |   | Output filename (auto-generated if omitted)      |
| `-s, --size <WxH>` |       | Image size (default: `1024x1024`)                |
| `-q, --quality <q>` |      | `low` \| `medium` \| `high` (default: `medium`)  |
| `-n, --count <n>`  |       | Number of images (default: 1)                    |
| `-d, --output-dir <dir>` |  | Output directory (default: `.`)                  |

## Batch Options

| Flag                   | Alias | Description                              |
|------------------------|-------|------------------------------------------|
| `-f, --file <path>`    |       | JSON array of task objects               |
| `-p, --prompts <path>` |       | Text file, one prompt per line           |
| `-c, --concurrency <n>`|       | Max parallel requests (default: 3)       |
| `-d, --output-dir <dir>`|      | Output directory (default: `.`)          |
| `-s, --size <WxH>`     |       | Default size for all tasks               |
| `-q, --quality <q>`    |       | Default quality for all tasks            |

## Examples

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

```bash
# Edit a local image
npm run dev -- generate -r input.png "make the sky sunset orange"

# Reference from a URL
npm run dev -- generate -r https://example.com/photo.jpg "turn into oil painting"

# Multiple references
npm run dev -- generate -r ref1.png -r ref2.png "blend these two styles"
```

Supported reference inputs: local file paths, HTTP(S) URLs, and `data:image/...;base64,...` URIs. Up to 16 references.

### Batch generation

```bash
# Inline prompts
npm run dev -- batch -c 3 "a red car" "a blue boat" "a green plane"

# From a text file
npm run dev -- batch -p prompts.txt -c 2 -d ./output

# From a JSON task file
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

## Supported Sizes

| Name        | Dimensions   | Notes                     |
|-------------|-------------|---------------------------|
| Square      | `1024x1024`  | Fastest                   |
| Landscape   | `1536x1024`  |                           |
| Portrait    | `1024x1536`  |                           |
| 2K Square   | `2048x2048`  | Experimental              |
| 2K Landscape| `2048x1152`  | Experimental              |
| 4K Landscape| `3840x2160`  | Experimental, max quality |

## Configuration

| Environment Variable    | Description                     | Default                       |
|-------------------------|---------------------------------|-------------------------------|
| `IMAGE_GEN_BASE_URL`    | API base URL                    | `http://localhost:8317/v1`    |
| `IMAGE_GEN_API_KEY`     | API key                         | `p`                           |

## Skills

The `skills/` directory contains [PI](https://github.com/earendil-works/pi-coding-agent) skill definitions for agent-assisted workflows:

- **[image-gen-cli](skills/image-gen-cli/SKILL.md)** — CLI usage reference for generating, editing, and batching images.
- **[writing-image-gen-prompts](skills/writing-image-gen-prompts/SKILL.md)** — Prompt engineering guide for photorealism, ads, infographics, logos, UI mockups, style transfer, and more.

## License

[MIT](LICENSE)
