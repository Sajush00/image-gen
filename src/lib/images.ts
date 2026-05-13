import type OpenAI from "openai";
import { client } from "./client.js";
import { loadReferenceFiles } from "./refs.js";
import type { GenerateOptions } from "../types.js";

export async function requestImages(options: GenerateOptions): Promise<OpenAI.Images.ImagesResponse> {
  if (options.refs.length > 0) {
    const files = await loadReferenceFiles(options.refs);

    return client.images.edit({
      model: "gpt-image-2",
      image: files as any,
      prompt: options.prompt,
      n: options.count,
      size: options.size as any,
      quality: options.quality as any,
    });
  }

  return client.images.generate({
    model: "gpt-image-2",
    prompt: options.prompt,
    n: options.count,
    size: options.size as any,
    quality: options.quality as any,
  });
}
