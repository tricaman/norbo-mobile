// gen-pet-photos.mjs — genera foto pet placeholder gradevoli (gradiente + emoji
// animale + nome) per popolare l'utenza screenshot. Usa `sharp` di norbo-api per
// rasterizzare SVG → JPEG. Output in scripts/screenshot-assets/.
//
// Uso (dalla root di norbo-api dove sharp è installato):
//   node /path/to/norbo-mobile/scripts/gen-pet-photos.mjs

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"

// sharp è installato in norbo-api → risolvi da lì
const require = createRequire("/Users/trica/personal/norbo/norbo-api/index.js")
const sharp = require("sharp")

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "screenshot-assets")
mkdirSync(OUT, { recursive: true })

// Ogni pet: emoji, nome, coppia colori del gradiente (caldi e vivaci).
const PETS = [
  { file: "milo-dog.jpg",   emoji: "🐕", name: "Milo",   c1: "#F5A623", c2: "#F76B1C" },
  { file: "luna-cat.jpg",   emoji: "🐈", name: "Luna",   c1: "#7B6CF6", c2: "#B06AB3" },
  { file: "nemo-fish.jpg",  emoji: "🐠", name: "Nemo",   c1: "#2AA9E0", c2: "#0F6FC6" },
]

const SIZE = 1000

function svg({ emoji, name, c1, c2 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
    <text x="50%" y="46%" font-size="440" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    <text x="50%" y="82%" font-size="90" font-family="DejaVu Sans, Arial, sans-serif"
          font-weight="700" fill="#ffffff" text-anchor="middle" opacity="0.95">${name}</text>
  </svg>`
}

for (const pet of PETS) {
  const buf = Buffer.from(svg(pet))
  const outPath = join(OUT, pet.file)
  await sharp(buf).jpeg({ quality: 90 }).toFile(outPath)
  console.log("✓", outPath)
}
console.log("Fatto:", PETS.length, "foto in", OUT)
