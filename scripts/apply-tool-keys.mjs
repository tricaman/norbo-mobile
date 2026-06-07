// One-off: splice the translated keys (scripts/_tool-translations/<code>.json)
// into src/i18n/locales/<code>.ts, matching the existing file style.
//
//   node scripts/apply-tool-keys.mjs            # all json files present
//   node scripts/apply-tool-keys.mjs ro tr      # only some
//
// Idempotent-ish: refuses to touch a file that already has a top-level `tools:`.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_DIR = resolve(__dirname, "_tool-translations");
const LOCALES_DIR = resolve(__dirname, "../src/i18n/locales");

// Serialize a nested object to TS source lines matching the locale files:
// 2-space indent, double-quoted values, bare identifier keys.
function serialize(obj, indent) {
  const pad = "  ".repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      lines.push(`${pad}${k}: {`);
      lines.push(...serialize(v, indent + 1));
      lines.push(`${pad}},`);
    } else {
      lines.push(`${pad}${k}: ${JSON.stringify(v)},`);
    }
  }
  return lines;
}

function block(name, obj, indent) {
  return [`${"  ".repeat(indent)}${name}: {`, ...serialize(obj, indent + 1), `${"  ".repeat(indent)}},`].join("\n");
}

const wanted = process.argv.slice(2);
const codes = wanted.length
  ? wanted
  : readdirSync(IN_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));

for (const code of codes) {
  const jsonPath = resolve(IN_DIR, `${code}.json`);
  const tsPath = resolve(LOCALES_DIR, `${code}.ts`);
  if (!existsSync(jsonPath)) {
    console.error(`✗ ${code}: no translation json`);
    continue;
  }
  const t = JSON.parse(readFileSync(jsonPath, "utf8"));
  let src = readFileSync(tsPath, "utf8");

  if (/^  tools: \{/m.test(src)) {
    console.error(`✗ ${code}: already has a tools block, skipping`);
    continue;
  }

  // 1) common.select  -> first key inside `common: {`
  src = src.replace(/^(  common: \{\n)/m, `$1    select: ${JSON.stringify(t.common.select)},\n`);

  // 2) pets.memorialSection -> first key inside `pets: {`
  src = src.replace(
    /^(  pets: \{\n)/m,
    `$1    memorialSection: ${JSON.stringify(t.pets.memorialSection)},\n`
  );

  // 3) the four new top-level blocks, appended before `} as const;`
  const appended =
    [
      block("tools", t.tools, 1),
      block("careKnowledge", t.careKnowledge, 1),
      block("paywall", t.paywall, 1),
      block("memorial", t.memorial, 1),
    ].join("\n") + "\n";

  if (!/^\} as const;/m.test(src)) throw new Error(`${code}: no '} as const;' terminator`);
  src = src.replace(/^\} as const;/m, `${appended}} as const;`);

  writeFileSync(tsPath, src);
  console.log(`✓ ${code}`);
}
