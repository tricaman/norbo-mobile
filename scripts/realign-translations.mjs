// Realign locale files: translate the keys that exist in the source-of-truth
// locale but are still missing from each target (via DeepSeek), splice them in,
// and run Prettier so the result matches the project's TypeScript style.
//
//   node scripts/realign-translations.mjs                 # all incomplete locales
//   node scripts/realign-translations.mjs ro tr           # only some
//   node scripts/realign-translations.mjs --dry-run       # report missing + translate to /tmp, don't touch .ts
//   node scripts/realign-translations.mjs --report        # just print what's missing, no API calls
//
// Idempotent: a locale that is already complete is left untouched.
// Reads EXPO_PUBLIC_DEEPSEEK_API_KEY from the environment or from ./.env.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import prettier from "prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCALES_DIR = resolve(ROOT, "src/i18n/locales");

// The locale whose values we translate FROM. English is complete, key-identical
// to the Italian source of truth, and the best pivot for DeepSeek across all
// targets. Switch to "it" to translate from the Italian master instead.
const SOURCE_LOCALE = "en";
// The locale that defines which keys MUST exist (the source of truth).
const TRUTH_LOCALE = "it";

// Human-readable language names for the prompt.
const LANGUAGE = {
  en: "English",
  it: "Italian",
  ar: "Arabic",
  bn: "Bengali",
  de: "German",
  es: "Spanish (Spain)",
  fr: "French (France)",
  hi: "Hindi",
  id: "Indonesian",
  ja: "Japanese",
  pt: "Brazilian Portuguese",
  ro: "Romanian",
  ru: "Russian",
  tr: "Turkish",
  ur: "Urdu",
  zh: "Simplified Chinese",
};

// --- DeepSeek key ------------------------------------------------------------
function readDeepseekKey() {
  if (process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY) return process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
  const envPath = resolve(ROOT, ".env");
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("EXPO_PUBLIC_DEEPSEEK_API_KEY="));
    if (line) return line.slice("EXPO_PUBLIC_DEEPSEEK_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("EXPO_PUBLIC_DEEPSEEK_API_KEY not found in env or ./.env");
}

// --- Load a locale .ts as a plain object (strip the only TS-ism: `as const`) --
async function load(code) {
  const ts = readFileSync(resolve(LOCALES_DIR, `${code}.ts`), "utf8").replace(/\bas const\b/g, "");
  const url = "data:text/javascript;base64," + Buffer.from(ts).toString("base64");
  return (await import(url)).default;
}

// --- Key helpers -------------------------------------------------------------
function keyPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...keyPaths(v, p));
    else out.push(p);
  }
  return out;
}
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const parts = path.split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {};
    o = o[parts[i]];
  }
  o[parts.at(-1)] = value;
}
function placeholders(str) {
  return (String(str).match(/\{\{[^}]+\}\}/g) || []).sort();
}

// --- Render a merged object back to a Prettier-formatted .ts file ------------
async function renderTs(code, obj) {
  // JSON is valid TS object-literal syntax; Prettier then normalises quotes,
  // key-quoting, trailing commas, and wrapping to the project's style.
  const body = JSON.stringify(obj, null, 2);
  const raw = `const ${code} = ${body} as const;\n\nexport default ${code};\n`;
  return prettier.format(raw, { parser: "typescript" });
}

// --- The prompt (generalized from the previous one-off) ----------------------
function systemPrompt(language) {
  return [
    `You are a professional software localizer for "norbo", a friendly mobile app that helps owners care for their pets (dogs, cats, fish, reptiles, and more).`,
    `Your job is to translate UI microcopy into ${language}.`,
    ``,
    `Hard rules — follow every one:`,
    `1. Output ONLY a single JSON object with EXACTLY the same shape as the input: same keys, same nesting, same order. Never add, remove, rename, translate, or reorder any key. Translate only the string VALUES.`,
    `2. Keep i18next placeholders verbatim and untouched, including the double braces and the text inside them: {{name}}, {{count}}, {{label}}, {{category}}, {{current}}, {{total}}. Do not translate, space, or reorder them. Every placeholder present in a value must appear unchanged in your translation, and you must not invent new ones.`,
    `3. Match register and formatting of each source string. Most strings are short UI labels/buttons written in lowercase — keep them lowercase and concise. Where the source is a full sentence with a capital letter and ending punctuation (e.g. disclaimers, toxicity notes), keep it a properly capitalized, punctuated sentence in the target language.`,
    `4. Translate meaning, not words: produce the natural, idiomatic phrasing a native ${language} speaker would expect inside a pet-care app, not a literal gloss. Use correct domain terminology (veterinary, aquarium-keeping, reptile husbandry, pet nutrition, body-condition scoring).`,
    `5. Proper names stay as-is: "WSAVA" and "Henneke" are names of body-condition-score scales — do not translate or transliterate them. Units like "cm" stay "cm".`,
    `6. Some messages are gentle or emotional (e.g. a pet memorial). Keep the warm, respectful, human tone.`,
    `7. For ${language}, write fully natural target-language text; do not leave source-language words untranslated unless they are proper names or standard loanwords in that language.`,
    ``,
    `Return the JSON object and nothing else — no markdown, no comments, no explanation.`,
  ].join("\n");
}

async function deepseek(key, language, sourceLanguage, slice) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 1.3, // DeepSeek's recommended setting for translation
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(language) },
        {
          role: "user",
          content:
            `Source language: ${sourceLanguage}. Target language: ${language}.\n` +
            `Translate the string values of this JSON object:\n\n` +
            JSON.stringify(slice, null, 2),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- Validate the translated slice: same shape + placeholders preserved ------
function validateSlice(srcSlice, got) {
  const a = keyPaths(srcSlice).sort().join("\n");
  const b = keyPaths(got).sort().join("\n");
  if (a !== b) throw new Error("translated slice has a different key shape than requested");
  for (const p of keyPaths(srcSlice)) {
    const ph = placeholders(getPath(srcSlice, p)).join(",");
    const gh = placeholders(getPath(got, p)).join(",");
    if (ph !== gh) throw new Error(`placeholder mismatch at ${p}`);
  }
}

// --- Main --------------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reportOnly = args.includes("--report");

const truth = await load(TRUTH_LOCALE);
const source = await load(SOURCE_LOCALE);
const truthKeys = keyPaths(truth);

const explicit = args.filter((a) => !a.startsWith("--"));
const allTargets = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ""))
  .filter((c) => c !== TRUTH_LOCALE && c !== SOURCE_LOCALE);
const codes = explicit.length ? explicit : allTargets;

// Report mode: no API calls, just show what's missing.
if (reportOnly) {
  console.log(`source of truth: ${TRUTH_LOCALE} (${truthKeys.length} keys)\n`);
  for (const code of codes) {
    const have = new Set(keyPaths(await load(code)));
    const missing = truthKeys.filter((k) => !have.has(k));
    console.log(`${code.padEnd(4)} ${missing.length === 0 ? "✓ complete" : `✗ ${missing.length} missing`}`);
  }
  process.exit(0);
}

const key = readDeepseekKey();
const outDir = dryRun ? mkdtempSync(resolve(tmpdir(), "norbo-i18n-")) : null;
if (dryRun) console.log(`dry-run: translated JSON will be written to ${outDir}\n`);

let ok = 0;
let touched = 0;
for (const code of codes) {
  const language = LANGUAGE[code];
  if (!language) {
    console.error(`✗ ${code}: no language name configured`);
    continue;
  }
  const target = await load(code);
  const have = new Set(keyPaths(target));
  const missing = truthKeys.filter((k) => !have.has(k));

  if (missing.length === 0) {
    console.log(`• ${code}: already complete`);
    ok++;
    continue;
  }

  // Build the slice to translate, taking values from the SOURCE locale.
  const slice = {};
  for (const p of missing) {
    let v = getPath(source, p);
    if (v === undefined) v = getPath(truth, p);
    setPath(slice, p, v);
  }

  console.log(`→ ${code}: translating ${missing.length} missing keys...`);
  let translated = null;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      translated = await deepseek(key, language, LANGUAGE[SOURCE_LOCALE], slice);
      validateSlice(slice, translated);
      break;
    } catch (e) {
      lastErr = e;
      translated = null;
      console.error(`  [${code}] attempt ${attempt} failed: ${e.message}`);
    }
  }
  if (!translated) {
    console.error(`✗ ${code}: gave up after 3 attempts (${lastErr?.message})`);
    continue;
  }

  if (dryRun) {
    writeFileSync(resolve(outDir, `${code}.json`), JSON.stringify(translated, null, 2) + "\n");
    console.log(`✓ ${code}: ${missing.length} keys translated -> ${code}.json`);
    ok++;
    continue;
  }

  // Splice translated values in, then re-render the whole file via Prettier.
  for (const p of missing) setPath(target, p, getPath(translated, p));

  // Guard: nothing missing, placeholders intact.
  const after = new Set(keyPaths(target));
  const stillMissing = truthKeys.filter((k) => !after.has(k));
  if (stillMissing.length) throw new Error(`${code}: still missing ${stillMissing.length} after merge`);
  for (const p of missing) {
    const ph = placeholders(getPath(truth, p)).join(",");
    const gh = placeholders(getPath(target, p)).join(",");
    if (ph !== gh) throw new Error(`${code}: placeholder mismatch at ${p} after merge`);
  }

  writeFileSync(resolve(LOCALES_DIR, `${code}.ts`), await renderTs(code, target));
  console.log(`✓ ${code}: +${missing.length} keys written`);
  ok++;
  touched++;
}

console.log(`\n${ok}/${codes.length} locales ok${dryRun ? " (dry-run)" : `, ${touched} file(s) modified`}`);
if (ok !== codes.length) process.exit(1);
