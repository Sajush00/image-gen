import { client } from "../lib/client.js";

export async function cmdListModels() {
  const resp = await client.models.list();
  console.log("Available models:\n");
  for (const m of resp.data) {
    console.log(`  ${m.id.padEnd(24)} (owned_by: ${m.owned_by})`);
  }
  const img = resp.data.filter((m) => m.id.toLowerCase().includes("image"));
  console.log(`\nImage models: ${img.map((m) => m.id).join(", ") || "(none)"}`);
}
