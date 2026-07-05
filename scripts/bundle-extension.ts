import { mkdirSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const pkgRoot = join(import.meta.dir, "..");
const outDir = join(pkgRoot, "out");
const outfile = join(outDir, "extension.js");
const entry = join(pkgRoot, "src", "extension.ts");

mkdirSync(outDir, { recursive: true });

await $`bun build ${entry} --outfile=${outfile} --target=node --format=cjs --external vscode --minify`;
console.log(`Bundled extension → ${outfile}`);