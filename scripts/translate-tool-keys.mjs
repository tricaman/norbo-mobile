// One-off: translate the newly-added tool/i18n keys into the 11 missing locales
// via DeepSeek, writing one JSON file per locale into scripts/_tool-translations/.
//
//   node scripts/translate-tool-keys.mjs            # all missing locales
//   node scripts/translate-tool-keys.mjs ro tr      # only some
//
// Then run scripts/apply-tool-keys.mjs to splice the results into the .ts files.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "_tool-translations");

// --- DeepSeek key (reuse the backend .env, never commit it) ------------------
function readDeepseekKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  const envPath = resolve(__dirname, "../../norbo-api/.env");
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("DEEPSEEK_API_KEY="));
  if (!line) throw new Error("DEEPSEEK_API_KEY not found in norbo-api/.env");
  return line.slice("DEEPSEEK_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

// --- Target locales (the 11 still missing the keys) --------------------------
const LOCALES = {
  ar: "Arabic",
  bn: "Bengali",
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

// --- English source of truth (mirrors en.ts) ---------------------------------
// Shape is preserved exactly; only the string values get translated.
const SOURCE = {
  common: { select: "select" },
  pets: { memorialSection: "in memory" },
  tools: {
    dogCalorieNeeds: {
      title: "dog calorie needs",
      description: "indicative daily energy requirement estimate",
      weight: "weight",
      age: "age",
      months: "months",
      activity: "activity level",
      low: "low",
      normal: "normal",
      high: "high",
      neuteredYes: "neutered",
      neuteredNo: "intact",
      result: "daily needs",
      disclaimer: "indicative value, not a substitute for your vet",
    },
    aquariumVolume: {
      title: "aquarium volume",
      description: "water volume from tank dimensions",
      length: "length",
      width: "width",
      height: "height",
      decor: "decor displacement",
      results: "results",
      gross: "gross volume",
      effective: "effective volume",
      stocking: "max stocking",
      stockingUnit: "cm of fish",
      disclaimer: "indicative value (freshwater)",
    },
    reptileEnvironmentGuide: {
      title: "reptile environment guide",
      description: "target temperatures and humidity by species",
      selectProfile: "species",
      temperature: "temperature",
      basking: "basking zone",
      cool: "cool zone",
      humidity: "humidity",
      disclaimer: "indicative values, not a substitute for your vet",
    },
    petAgeHumanYears: {
      title: "age in human years",
      description: "converts your pet's age into indicative human years",
      age: "age",
      months: "months",
      size: "size",
      small: "small",
      medium: "medium",
      large: "large",
      result: "human age",
      years: "years",
      disclaimer: "indicative value, not a substitute for your vet",
    },
    common: {
      addPetTitle: "add a pet",
      addPetSubtitle: "link this tool to your animal",
    },
    unitConverter: {
      weight: "weight",
      length: "length",
      temperature: "temperature",
      volume: "volume",
      value: "value",
      from: "from",
      to: "to",
      result: "result",
    },
    maintenanceCost: {
      amount: "amount",
      week: "week",
      month: "month",
      year: "year",
      monthly: "monthly cost",
      yearly: "yearly cost",
      cat: {
        VET: "vet",
        FOOD: "food",
        ACCESSORIES: "accessories",
        GROOMING: "grooming",
        OTHER: "other",
      },
    },
    foodConsumption: {
      packageWeight: "package weight",
      dailyRation: "daily ration",
      currentStock: "current stock",
      results: "results",
      daysLeft: "days left",
      days: "days",
      reorderDate: "reorder date",
      createReminder: "create reorder reminder",
      reminderCreated: "reminder created",
      reminderTitle: "Reorder food for {{name}}",
    },
    foodPlantToxicity: {
      placeholder: "food or plant name",
      result: "result",
      hint: "type a food or plant to check whether it is safe",
      unknown: "not listed: when in doubt, contact your vet",
      disclaimer: "If ingested, contact your vet immediately.",
      risk: { SAFE: "safe", CAUTION: "caution", TOXIC: "toxic" },
      notes: {
        chocolate: "Chocolate contains theobromine, which is toxic.",
        grapes: "Grapes and raisins can cause kidney damage.",
        allium: "Onion and garlic damage red blood cells.",
        xylitol: "Xylitol causes severe hypoglycemia.",
        carrot: "Carrots are generally safe in moderation.",
        lily: "Lilies are highly toxic to cats.",
        dairy: "Many cats are lactose intolerant.",
      },
    },
    bodyConditionScore: {
      unsupported: "scale not available for this category",
      disclaimer: "Indicative tool, not a substitute for your vet's assessment.",
      scale: { wsava: "WSAVA scale", henneke: "Henneke scale" },
      q: {
        ribs: "ribs",
        waist: "waist",
        tuck: "abdomen (side view)",
        neck: "neck / crest",
        tailhead: "tailhead",
      },
      opt: {
        ribs: { low: "very prominent", ideal: "felt, minimal fat", high: "not palpable" },
        waist: { low: "very pronounced", ideal: "well-proportioned", high: "absent" },
        tuck: { low: "very tucked", ideal: "tucked", high: "distended" },
        neck: { low: "thin, bones visible", ideal: "well-balanced", high: "thick, fatty" },
        tailhead: { low: "bones prominent", ideal: "well-balanced", high: "fat-covered" },
      },
      interp: { under: "underweight", ideal: "ideal weight", over: "overweight" },
    },
  },
  careKnowledge: {
    reptile: {
      beardedDragon: "bearded dragon",
      leopardGecko: "leopard gecko",
      ballPython: "ball python",
      cornSnake: "corn snake",
    },
  },
  paywall: {
    badge: "premium",
    title: "premium tool",
    description: "this tool is included with the premium subscription.",
    cta: "subscribe",
    comingSoon: "subscriptions coming soon",
  },
  memorial: {
    markAsMemory: "mark as memory",
    markAsMemorySubtitle: "data will be kept safe",
    empathyTitle: "we're with you",
    empathyMessage:
      "the memories of {{name}} will always be here, safe and sound. you can come back to relive every moment together.",
    dateLabel: "date",
    datePlaceholder: "when did it happen?",
    noteLabel: "a last thought",
    notePlaceholder: "write something if you'd like...",
    confirm: "confirm",
    continue: "continue",
    safeMessage: "the memories of {{name}} are safe here",
    restore: "restore",
    restoreConfirmTitle: "restore pet",
    restoreConfirmMessage: "bring {{name}} back to active pets?",
    restoreConfirmOk: "restore",
    restoreConfirmCancel: "cancel",
    restoreSuccess: "{{name}} is back among active pets",
    restoreExpired: "the 14-day restore window has expired",
    anniversaryOptIn: "remind me of the anniversary",
    managementSection: "management",
  },
};

// --- The prompt --------------------------------------------------------------
function systemPrompt(language) {
  return [
    `You are a professional software localizer for "norbo", a friendly mobile app that helps owners care for their pets (dogs, cats, fish, reptiles, and more).`,
    `Your job is to translate UI microcopy from English into ${language}.`,
    ``,
    `Hard rules — follow every one:`,
    `1. Output ONLY a single JSON object with EXACTLY the same shape as the input: same keys, same nesting, same order. Never add, remove, rename, translate, or reorder any key. Translate only the string VALUES.`,
    `2. Keep i18next placeholders verbatim and untouched, including the double braces and the text inside them: {{name}}, {{count}}, {{category}}, {{current}}, {{total}}. Do not translate, space, or reorder them. Every placeholder present in a value must appear unchanged in your translation, and you must not invent new ones.`,
    `3. Match register and formatting of each source string. Most strings are short UI labels/buttons written in lowercase — keep them lowercase and concise. Where the source is a full sentence with a capital letter and ending punctuation (e.g. disclaimers, toxicity notes), keep it a properly capitalized, punctuated sentence in the target language.`,
    `4. Translate meaning, not words: produce the natural, idiomatic phrasing a native ${language} speaker would expect inside a pet-care app, not a literal gloss. Use correct domain terminology (veterinary, aquarium-keeping, reptile husbandry, pet nutrition, body-condition scoring).`,
    `5. Proper names stay as-is: "WSAVA" and "Henneke" are names of body-condition-score scales — do not translate or transliterate them. Units like "cm" stay "cm".`,
    `6. These are gentle, sometimes emotional messages (e.g. a pet memorial). Keep the warm, respectful, human tone.`,
    `7. For ${language}, write fully natural target-language text; do not leave English words untranslated unless they are proper names or standard loanwords in that language.`,
    ``,
    `Return the JSON object and nothing else — no markdown, no comments, no explanation.`,
  ].join("\n");
}

// --- Structure validation ----------------------------------------------------
function keyPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...keyPaths(v, p));
    else out.push(p);
  }
  return out.sort();
}

function placeholders(str) {
  return (String(str).match(/\{\{[^}]+\}\}/g) || []).sort();
}

function validate(src, got) {
  const a = keyPaths(src).join("\n");
  const b = keyPaths(got).join("\n");
  if (a !== b) throw new Error(`key shape mismatch`);
  // every placeholder in source must survive in the translation
  const walk = (s, g, path = "") => {
    for (const k of Object.keys(s)) {
      const p = path ? `${path}.${k}` : k;
      if (s[k] && typeof s[k] === "object") walk(s[k], g[k], p);
      else {
        const ph = placeholders(s[k]).join(",");
        const gh = placeholders(g[k]).join(",");
        if (ph !== gh) throw new Error(`placeholder mismatch at ${p}: "${s[k]}" -> "${g[k]}"`);
      }
    }
  };
  walk(src, got);
}

// --- DeepSeek call -----------------------------------------------------------
async function translate(key, code, language) {
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
            `Target language: ${language} (locale code "${code}").\n` +
            `Translate the values of this JSON object:\n\n` +
            JSON.stringify(SOURCE, null, 2),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- Main --------------------------------------------------------------------
const key = readDeepseekKey();
mkdirSync(OUT_DIR, { recursive: true });

const wanted = process.argv.slice(2);
const codes = wanted.length ? wanted : Object.keys(LOCALES);

const results = await Promise.allSettled(
  codes.map(async (code) => {
    const language = LOCALES[code];
    if (!language) throw new Error(`unknown locale "${code}"`);
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const out = await translate(key, code, language);
        validate(SOURCE, out);
        writeFileSync(resolve(OUT_DIR, `${code}.json`), JSON.stringify(out, null, 2) + "\n");
        return code;
      } catch (e) {
        lastErr = e;
        console.error(`  [${code}] attempt ${attempt} failed: ${e.message}`);
      }
    }
    throw new Error(`[${code}] gave up: ${lastErr?.message}`);
  })
);

let ok = 0;
for (const r of results) {
  if (r.status === "fulfilled") {
    ok++;
    console.log(`✓ ${r.value}`);
  } else {
    console.error(`✗ ${r.reason.message}`);
  }
}
console.log(`\n${ok}/${codes.length} locales written to scripts/_tool-translations/`);
if (ok !== codes.length) process.exit(1);
