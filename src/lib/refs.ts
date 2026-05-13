import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";

export async function loadReferenceFiles(refs: string[]) {
  if (refs.length > 16) throw new Error("At most 16 reference images are supported");

  return Promise.all(refs.map(async (refPath, idx) => {
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

    return new File([new Uint8Array(image)], name, { type: mime });
  }));
}
