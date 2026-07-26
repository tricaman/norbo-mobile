// seed-screenshot-user.mjs — popola l'utenza reviewer "screenshot" con dati
// realistici (pet + foto + eventi salute + promemoria + spese) via API HTTP,
// per catturare gli screenshot dello store dai simulatori.
//
// Prerequisiti:
//   - backend norbo-api in ascolto su http://localhost:3000 (pnpm dev)
//   - .env con REVIEWER_BACKDOOR_ENABLED=true, l'email sotto in
//     REVIEWER_BACKDOOR_EMAILS, OTP 374185, e MEDIA_STORAGE_* COMMENTATE
//     (storage locale, così l'upload foto non richiede R2).
//
// Uso:
//   node scripts/seed-screenshot-user.mjs
//
// Idempotenza: NON deduplica. Rilanciandolo crea di nuovo tutto → svuota prima
// i dati dell'utente se serve (o usa un'email diversa).

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(__dirname, "screenshot-assets")

const BASE = process.env.API_BASE || "http://localhost:3000"
const EMAIL = process.env.REVIEW_EMAIL || "appstore-review@norbo.app"
const OTP = process.env.REVIEW_OTP || "374185"
const ORIGIN = "http://localhost:3000"

// --- helper date: passato (giorni fa) e futuro (giorni avanti) in ISO ---
const now = Date.now()
const daysAgo = (d) => new Date(now - d * 864e5).toISOString()
const daysAhead = (d) => new Date(now + d * 864e5).toISOString()

let COOKIE = ""

async function api(path, { method = "GET", body, raw, contentType } = {}) {
  const headers = { Origin: ORIGIN }
  if (COOKIE) headers.Cookie = COOKIE
  let payload
  if (raw) {
    payload = raw
    headers["Content-Type"] = contentType || "application/octet-stream"
  } else if (body !== undefined) {
    payload = JSON.stringify(body)
    headers["Content-Type"] = "application/json"
  }
  const res = await fetch(path.startsWith("http") ? path : BASE + path, {
    method,
    headers,
    body: payload,
  })
  // cattura il session cookie
  const setCookie = res.headers.get("set-cookie")
  if (setCookie) {
    const m = setCookie.match(/(better-auth\.session_token=[^;]+)/)
    if (m) COOKIE = m[1]
  }
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}\n${text.slice(0, 500)}`)
  }
  return json
}

async function login() {
  console.log(`→ login backdoor come ${EMAIL}`)
  await api("/auth/otp/send", { method: "POST", body: { email: EMAIL, type: "sign-in" } })
  const res = await api("/auth/sign-in/email-otp", {
    method: "POST",
    body: { email: EMAIL, otp: OTP },
  })
  if (!COOKIE) throw new Error("Nessun session cookie ricevuto dopo il login")
  console.log(`  ok, user=${res?.user?.id ?? "?"}`)
}

// --- upload foto: upload-url → PUT bytes → confirm → assetId ---
async function uploadPhoto(fileName, contextRef) {
  const filePath = join(ASSETS, fileName)
  const bytes = readFileSync(filePath)
  const { assetId, uploadUrl } = await api("/media/upload-url", {
    method: "POST",
    body: {
      context: "PET_PHOTO",
      contextRef,
      mimeType: "image/jpeg",
      sizeBytes: bytes.length,
    },
  })
  // uploadUrl può essere assoluto (R2) o relativo/locale: normalizza
  const putUrl = uploadUrl.startsWith("http") ? uploadUrl : BASE + uploadUrl
  const put = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: bytes,
  })
  if (!put.ok) throw new Error(`PUT foto → ${put.status} ${await put.text()}`)
  await api(`/media/${assetId}/confirm`, { method: "POST" })
  return assetId
}

async function createPet(pet) {
  const photoId = await uploadPhoto(pet.photo, "pet:new")
  const body = {
    category: pet.category,
    name: pet.name,
    sex: pet.sex,
    birthDate: pet.birthDate,
    sterilized: pet.sterilized ?? null,
    speciesLabelFreetext: pet.species ?? null,
    photoMediaAssetId: photoId,
    notes: pet.notes ?? null,
  }
  const created = await api("/pets", { method: "POST", body })
  console.log(`  🐾 pet ${pet.name} (${pet.category}) id=${created.id}`)
  return created.id
}

async function addEvent(petId, ev) {
  const created = await api(`/pets/${petId}/events`, { method: "POST", body: ev })
  console.log(`     event ${ev.type} "${ev.title}"`)
  return created
}

async function addReminder(rem) {
  await api("/reminders", { method: "POST", body: { recurrence: null, ...rem } })
  console.log(`     ⏰ reminder "${rem.title}"`)
}

async function addExpense(exp) {
  await api("/expenses", { method: "POST", body: exp })
  console.log(`     💰 expense ${exp.amount}€ ${exp.category}`)
}

async function main() {
  await login()

  // ── PET 1: Milo, cane ──────────────────────────────────────────────
  const milo = await createPet({
    name: "Milo",
    category: "MAMMAL_DOG",
    species: "Golden Retriever",
    sex: "MALE",
    sterilized: true,
    birthDate: daysAgo(365 * 3 + 40),
    photo: "milo-dog.jpg",
    notes: "Loves the park and peanut butter.",
  })
  await addEvent(milo, {
    mode: "past", type: "VACCINATION", occurredAt: daysAgo(120),
    title: "Rabies vaccine", description: "Annual booster",
    cost: 45, currency: "EUR",
    extra: { vaccineName: "Nobivac Rabies", nextDueDate: daysAhead(245), vetName: "Dr. Rossi" },
    includeInBooklet: true,
  })
  await addEvent(milo, {
    mode: "past", type: "WEIGHT_RECORD", occurredAt: daysAgo(20),
    title: "Weight check", extra: { weightMg: 31_500_000 },
  })
  await addEvent(milo, {
    mode: "past", type: "VET_VISIT", occurredAt: daysAgo(60),
    title: "Annual checkup", cost: 60, currency: "EUR",
    extra: { reason: "Routine health check", vetName: "Dr. Rossi", clinic: "PetCare Clinic", diagnosis: "Healthy" },
    includeInBooklet: true,
  })
  await addReminder({ subjectType: "HEALTH_EVENT", petId: milo, title: "Milo — parasite treatment", dueAt: daysAhead(3) })
  await addReminder({ subjectType: "ADMIN", petId: milo, title: "Renew dog license", dueAt: daysAhead(12) })
  await addExpense({ petId: milo, amount: 45, category: "VET", description: "Rabies vaccine", occurredAt: daysAgo(120) })
  await addExpense({ petId: milo, amount: 60, category: "VET", description: "Annual checkup", occurredAt: daysAgo(60) })
  await addExpense({ petId: milo, amount: 38.9, category: "FOOD", description: "Kibble 12kg", occurredAt: daysAgo(15) })

  // ── PET 2: Luna, gatto ─────────────────────────────────────────────
  const luna = await createPet({
    name: "Luna",
    category: "MAMMAL_CAT",
    species: "European Shorthair",
    sex: "FEMALE",
    sterilized: true,
    birthDate: daysAgo(365 * 2 + 120),
    photo: "luna-cat.jpg",
    notes: "Indoor cat, a bit shy with strangers.",
  })
  await addEvent(luna, {
    mode: "past", type: "VACCINATION", occurredAt: daysAgo(200),
    title: "Trivalent vaccine", cost: 40, currency: "EUR",
    extra: { vaccineName: "Feligen CRP", nextDueDate: daysAhead(165), vetName: "Dr. Bianchi" },
    includeInBooklet: true,
  })
  await addEvent(luna, {
    mode: "past", type: "PARASITE_TREATMENT", occurredAt: daysAgo(30),
    title: "Deworming", cost: 15, currency: "EUR",
    extra: { productName: "Milbemax", treatmentType: "INTERNAL", nextDueDate: daysAhead(60) },
  })
  await addEvent(luna, {
    mode: "past", type: "WEIGHT_RECORD", occurredAt: daysAgo(10),
    title: "Weight check", extra: { weightMg: 4_200_000 },
  })
  await addReminder({ subjectType: "CONSUMABLE", petId: luna, title: "Luna — buy litter", dueAt: daysAhead(1) })
  await addReminder({ subjectType: "HEALTH_EVENT", petId: luna, title: "Luna — next vaccine", dueAt: daysAhead(165) })
  await addExpense({ petId: luna, amount: 40, category: "VET", description: "Trivalent vaccine", occurredAt: daysAgo(200) })
  await addExpense({ petId: luna, amount: 22.5, category: "ACCESSORIES", description: "Scratching post", occurredAt: daysAgo(45) })
  await addExpense({ petId: luna, amount: 15, category: "VET", description: "Deworming", occurredAt: daysAgo(30) })

  // ── PET 3: Nemo, pesce ─────────────────────────────────────────────
  const nemo = await createPet({
    name: "Nemo",
    category: "FISH_SALTWATER",
    species: "Clownfish",
    sex: "UNKNOWN",
    birthDate: daysAgo(400),
    photo: "nemo-fish.jpg",
    notes: "Lives in the reef tank with an anemone.",
  })
  await addEvent(nemo, {
    mode: "past", type: "WATER_PARAMETERS", occurredAt: daysAgo(7),
    title: "Water test", extra: {},
  })
  await addEvent(nemo, {
    mode: "past", type: "WATER_CHANGE", occurredAt: daysAgo(5),
    title: "20% water change", extra: {},
  })
  await addReminder({ subjectType: "MAINTENANCE", petId: nemo, title: "Nemo — water change", dueAt: daysAhead(2) })
  await addExpense({ petId: nemo, amount: 12.9, category: "OTHER", description: "Aquarium salt", occurredAt: daysAgo(9) })

  console.log("\n✅ Utenza screenshot popolata. Login nell'app con:")
  console.log(`   email: ${EMAIL}`)
  console.log(`   OTP:   ${OTP}`)
}

main().catch((e) => {
  console.error("\n❌ Errore:\n", e.message)
  process.exit(1)
})
