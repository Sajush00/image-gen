---
name: writing-image-gen-prompts
description: Write, refine, critique, and template prompts for gpt-image generation/editing workflows. Use when the user asks for an image prompt, wants to improve a prompt, needs prompt patterns for photorealism, infographics, ads, UI mockups, logos, comics, scientific visuals, text-in-image, style transfer, compositing, product mockups, virtual try-on, or precision edits.
---

# Writing Image Generation Prompts

Use this skill whenever the task is to create or improve prompts for OpenAI-style image generation models, especially `gpt-image-2`, and for the local `image-gen` CLI.

## Core model guidance

Prefer `gpt-image-2` for new work. It is the default for production-quality image generation and editing, especially for:

- photorealism and natural images
- text-heavy images, ads, slides, diagrams, and infographics
- identity-sensitive edits and character consistency
- compositing and multi-image reference workflows
- fewer retries and higher first-pass quality

Quality selection:

- `low`: fast drafts, high-volume ideation, latency-sensitive batches
- `medium`: general default for polished outputs
- `high`: small/dense text, charts, diagrams, infographics, close portraits, identity-sensitive work, high-resolution assets

Common sizes:

- `1024x1024`: square general default
- `1024x1536`: portrait / vertical social / posters
- `1536x1024`: landscape / educational diagrams
- `1536x864`: widescreen slides
- `2560x1440`: reliable upper boundary for QHD-style outputs

For `gpt-image-2`, custom sizes must satisfy:

- max edge less than `3840px`
- both edges multiple of `16`
- long:short ratio no greater than `3:1`
- total pixels between `655,360` and `8,294,400`
- outputs above `2560x1440` are more experimental

## Prompt structure

Use a clear, skimmable order:

1. **Goal / deliverable**: what should be created and why
2. **Scene / background**: environment, setting, world context
3. **Subject**: main object/person/character/product
4. **Composition**: framing, camera angle, layout, placement, negative space
5. **Style / medium**: photorealistic photo, vector logo, watercolor, UI mockup, 3D render, etc.
6. **Details / quality cues**: materials, texture, lighting, atmosphere, typography
7. **Constraints**: what to avoid, what must remain unchanged, text exactness

For complex prompts, use short labeled sections rather than one long paragraph.

### General template

```text
Create [deliverable] for [use case/audience].

Scene / subject:
[Describe setting, main subject, action, scale, and important objects.]

Composition:
[Framing, viewpoint, layout, placement, negative space, aspect-specific needs.]

Style:
[Medium, visual language, lighting, mood, palette, rendering style.]

Important details:
[Materials, textures, facial/body details, labels, UI/data elements, copy.]

Constraints:
[No extra text, no watermark, no logos/trademarks, preserve X, avoid Y.]
```

## Prompting fundamentals

- State the intended artifact: ad, UI mock, infographic, logo, classroom diagram, slide, product mockup, etc.
- Be concrete about materials, shapes, textures, scale, lighting, and layout.
- For photorealism, explicitly use **photorealistic** or similar phrases like "real photograph" or "professional photography."
- Use camera and lighting language for overall look, not exact physical simulation.
- For people, specify pose, gaze, body framing, scale, and object interaction.
- For layout-sensitive work, specify placement: "logo top-right," "subject centered," "negative space on left."
- Avoid overloading. Start with a clean base prompt, then iterate with small single-change edits.
- Restate critical invariants on every edit iteration to prevent drift.

## Text in images

When image text matters:

- Put exact text in quotes.
- Say it must appear **verbatim**.
- Specify placement, font style, size, color, contrast, and hierarchy.
- Say "no extra text" and "text appears once" if applicable.
- Use `quality="high"` for small, dense, or multi-font text.
- For unusual words or brand names, spell them out letter-by-letter if needed.

Template:

```text
Include ONLY this text, exactly as written, with no extra characters:
"[COPY]"
Typography: [font style], [weight], [color], [placement], high contrast, clean kerning.
Ensure the text is perfectly legible and appears exactly once.
```

## Editing prompts

For edits, separate **what changes** from **what must stay the same**.

Use this pattern:

```text
Change only [specific target].
Keep everything else unchanged: [identity, geometry, layout, background, camera angle, lighting, labels, logos, surrounding objects].
Match the original lighting, perspective, scale, shadows, color temperature, and image quality.
Do not add text, watermarks, logos, new objects, or style changes.
```

For surgical edits, also say not to alter saturation, contrast, arrows, labels, camera angle, or surrounding objects.

## Multi-image references

Reference images by index and role:

```text
Image 1: [base scene/product/person].
Image 2: [style reference/object/clothing/person to insert].

Use Image 1 as the base. Apply [specific element/style] from Image 2 to [target area].
Preserve [base scene invariants]. Match lighting, perspective, scale, shadows, and texture.
```

## Use-case patterns

### Infographics / educational diagrams

Use for structured explanations, posters, labeled diagrams, timelines, and classroom visuals. Prefer `quality="high"` for dense labels.

```text
Create a clean infographic titled "[TITLE]" for [audience].
Explain [concept] using [format: flow diagram / labeled cutaway / timeline].
Include these required labels: [labels].
Use clear arrows, consistent icon style, readable text, and generous white space.
Avoid tiny text, decorative clutter, extra labels, or scientific inaccuracies.
```

### Photorealistic natural images

```text
Create a photorealistic candid photograph of [subject] in [setting].
[Subject] is [action/pose], with realistic details such as [skin/material/fabric imperfections].
Shot as a real moment, [framing] at [angle], with [lighting].
Natural colors, believable texture, everyday detail, unposed feeling.
No glamorization, no heavy retouching, no cinematic overprocessing.
```

### Logos

```text
Create an original, non-infringing logo for [brand], a [business].
The logo should feel [personality words].
Use clean vector-like shapes, strong silhouette, balanced negative space, and scalability.
Flat design, minimal strokes, plain background, centered with generous padding.
No watermark, no mockup, no unrelated symbols, no trademarked references.
```

### Ads / marketing creatives

Write like a creative brief.

```text
Create a polished campaign ad for [brand] targeting [audience].
Brand vibe: [positioning/culture/style].
Scene: [people/product/environment/action].
Composition: [layout and focal hierarchy].
Include the tagline exactly once: "[TAGLINE]".
Typography: [style/placement/contrast].
No extra text, no watermarks, no unrelated logos.
```

### UI mockups

```text
Create a realistic [mobile/web] UI mockup for [product].
Show [main screen/state] with [specific interface elements].
Prioritize usable layout, clear hierarchy, spacing, and practical navigation.
Visual style: [background, accent colors, typography, density].
Make it look like a real shipped app, not concept art.
```

### Slides / charts / productivity assets

```text
Create one [slide/chart/workflow diagram] titled "[TITLE]".
Canvas: [landscape/portrait], clean professional layout.
Include exact data/text: [numbers, labels, footnotes].
Use readable typography, clear hierarchy, polished spacing, and minimal decoration.
Avoid clip art, stock photography, excessive gradients, shadows, and generic filler.
```

### Comic strips / story panels

```text
Create a [vertical/horizontal] comic strip with [N] equal-sized panels.
Panel 1: [clear visual beat].
Panel 2: [clear visual beat].
Panel 3: [clear visual beat].
Panel 4: [clear visual beat].
Use consistent character design, readable action, and clear pacing.
```

### Style transfer

```text
Use Image 1 as the style reference: preserve its palette, texture, brushwork, line quality, and visual language.
Generate [new subject/scene] in that same style.
Keep [background/framing constraints].
No extra elements, no text, no watermarks.
```

### Virtual try-on / clothing edits

```text
Dress the person in Image 1 using the clothing from Images [2..N].
Do not change face, facial features, skin tone, body shape, pose, identity, hairstyle, expression, or proportions.
Replace only the clothing. Fit garments naturally to the existing pose and body geometry with realistic drape, folds, occlusion, lighting, and shadows.
Do not change background, camera angle, framing, image quality, or add accessories/text/logos.
```

### Product extraction / catalog mockups

```text
Extract the product from the input image and place it on a plain white opaque background.
Center the product with a crisp silhouette and no halos or fringing.
Preserve product geometry and label legibility exactly.
Add only light polishing and a subtle realistic contact shadow.
Do not restyle the product.
```

### Object removal

```text
Remove [object] from the image.
Do not change anything else.
Preserve background, lighting, shadows, perspective, camera angle, subject identity, and surrounding objects.
Fill the removed area naturally and photorealistically.
```

### Insert person/object into scene

```text
Place [object/person from Image X] into [scene from Image Y] at [location].
Match lighting, perspective, scale, shadows, color temperature, and photographic quality.
Preserve the base scene, background, camera angle, and all unrelated objects.
Preserve the inserted subject's identity/shape/design.
```

### Lighting / weather transformation

```text
Change the scene to [time/weather/season].
Change only environmental conditions: lighting direction, shadow quality, atmosphere, precipitation, ground wetness, and color temperature.
Preserve identity, geometry, camera angle, object placement, labels, and composition.
```

### Character consistency / children's book workflow

For the first image, establish a character anchor:

```text
Create a children's book illustration introducing the main character.
Character: [appearance, outfit, proportions, personality].
Theme: [story role].
Style: [medium, palette, line quality].
Constraints: original character, no text, no watermark, simple background.
```

For later images, edit from the anchor and restate invariants:

```text
Continue the story using the same character from the reference image.
Scene: [new action and environment].
Character consistency: same [outfit], same facial features, same proportions, same palette, same personality.
Do not redesign the character. No text, no watermarks.
```

## Local CLI usage reminder

When the user wants to generate the image after writing the prompt, use the local CLI skill as well:

```bash
npm run dev -- generate -q medium -s 1024x1536 "[prompt]"
```

For drafts use `-q low`; for dense text or diagrams use `-q high`.
