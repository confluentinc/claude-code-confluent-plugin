import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function installCommands(): Promise<void> {
  const sourceDir = join(__dirname, "..", ".claude", "commands");
  const targetDir = join(homedir(), ".claude", "commands");

  let files: string[];
  try {
    files = (await readdir(sourceDir)).filter((f) => f.endsWith(".md"));
  } catch {
    console.error(`Error: Could not find commands directory at ${sourceDir}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("Error: No command files found to install.");
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });

  let installed = 0;
  for (const file of files) {
    const content = await readFile(join(sourceDir, file), "utf-8");
    const transformed = content.replace(/\/project:/g, "/");
    await writeFile(join(targetDir, file), transformed, "utf-8");
    installed++;
  }

  console.log(`Installed ${installed} command(s) to ${targetDir}:\n`);
  for (const file of files) {
    const name = file.replace(/\.md$/, "");
    console.log(`  /${name}`);
  }
  console.log(
    "\nRestart Claude Code for the commands to become available."
  );
}
