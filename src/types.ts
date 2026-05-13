export interface GenerateOptions {
  prompt: string;
  refs: string[];
  output: string;
  size: string;
  quality: string;
  count: number;
  outputDir: string;
}

export interface BatchOptions {
  file?: string;
  prompts?: string;
  concurrency: number;
  outputDir: string;
  size: string;
  quality: string;
}

export interface BatchTask {
  prompt: string;
  refs?: string[];
  output?: string;
  size?: string;
  quality?: string;
}

export interface BatchResult {
  idx: number;
  prompt: string;
  files: string[];
  ok: boolean;
  error?: string;
}
