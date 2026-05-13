import "dotenv/config";
import OpenAI from "openai";

export const client = new OpenAI({
  baseURL: process.env.IMAGE_GEN_BASE_URL ?? "http://localhost:8317/v1",
  apiKey: process.env.IMAGE_GEN_API_KEY ?? "p",
});
