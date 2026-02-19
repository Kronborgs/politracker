import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export * from "./schemas";

export function loadPrompt(name: "stance_v1"): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  const file = join(dir, "..", "src", "prompts", `${name}.txt`);
  return readFileSync(file, "utf8");
}

export const MAX_SNIPPET_LEN = 240;
