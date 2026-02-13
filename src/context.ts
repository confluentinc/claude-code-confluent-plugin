import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Derive project root from script location (dist/context.js → one level up)
// This is reliable regardless of the MCP server process's cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const CONTEXT_PATH = join(PROJECT_ROOT, ".confluent-context.json");

export interface ApiKeyEntry {
  api_key: string;
  api_secret: string;
  resource_kind: string;
  display_name: string;
  created_at: string;
}

export interface ContextFile {
  environment_id?: string;
  environment_name?: string;
  api_keys?: Record<string, ApiKeyEntry>;
}

export async function readContext(): Promise<ContextFile> {
  try {
    const raw = await readFile(CONTEXT_PATH, "utf-8");
    return JSON.parse(raw) as ContextFile;
  } catch {
    return {};
  }
}

export async function writeContext(ctx: ContextFile): Promise<void> {
  await writeFile(CONTEXT_PATH, JSON.stringify(ctx, null, 2) + "\n", "utf-8");
}

export async function saveApiKey(
  resourceId: string,
  apiKey: string,
  apiSecret: string,
  resourceKind: string,
  displayName: string
): Promise<void> {
  const ctx = await readContext();
  if (!ctx.api_keys) {
    ctx.api_keys = {};
  }
  ctx.api_keys[resourceId] = {
    api_key: apiKey,
    api_secret: apiSecret,
    resource_kind: resourceKind,
    display_name: displayName,
    created_at: new Date().toISOString(),
  };
  await writeContext(ctx);
}

export async function removeApiKey(apiKeyId: string): Promise<void> {
  const ctx = await readContext();
  if (!ctx.api_keys) return;
  for (const [resourceId, entry] of Object.entries(ctx.api_keys)) {
    if (entry.api_key === apiKeyId) {
      delete ctx.api_keys[resourceId];
      await writeContext(ctx);
      return;
    }
  }
}

export async function getApiKeyForResource(
  resourceId: string
): Promise<{ api_key: string; api_secret: string } | null> {
  const ctx = await readContext();
  const entry = ctx.api_keys?.[resourceId];
  if (!entry) return null;
  return { api_key: entry.api_key, api_secret: entry.api_secret };
}
