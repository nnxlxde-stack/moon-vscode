import { cpSync, existsSync, rmSync } from "fs";
import { join } from "path";

const pkgRoot = join(import.meta.dir, "..");
const dest = join(pkgRoot, "stdlib");

const sources = [
  process.env.MOON_STDLIB_SOURCE?.trim(),
  join(pkgRoot, "..", "moon-lang", "stdlib"),
  join(pkgRoot, "..", "..", "moon-lang", "stdlib"),
].filter((value): value is string => Boolean(value));

const src = sources.find((candidate) => existsSync(candidate));
if (!src) {
  console.error(
    "stdlib not found. Set MOON_STDLIB_SOURCE or clone moon-lang as a sibling directory.",
  );
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });
console.log(`Copied stdlib → ${dest}`);