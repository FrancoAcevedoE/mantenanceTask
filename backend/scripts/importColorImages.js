/**
 * Importa las imágenes de muestras de colores al catálogo de MongoDB.
 * Uso: node --env-file=.env scripts/importColorImages.js
 */

import mongoose from 'mongoose'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Modelos ──────────────────────────────────────────────────────────────────
const fileSchema = new mongoose.Schema({
  filename: String, originalName: String, mimetype: String,
  data: { type: String, required: true }, size: Number,
}, { timestamps: true })
const File = mongoose.models.File || mongoose.model('File', fileSchema)

const colorSchema = new mongoose.Schema({ code: String, name: String, tipo: String, grupoColor: Number, image: String })
const Color = mongoose.models.Color || mongoose.model('Color', colorSchema)

// ── Config ───────────────────────────────────────────────────────────────────
const IMAGES_DIR = resolve(
  __dirname, '../../tool/public/listaPrecios/colores/muestras colores'
)
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseCode(filename) {
  // "5520 Blanco Nube.jpg" → "5520"
  const m = basename(filename).match(/^(\d{4})\s/)
  return m ? m[1] : null
}

function hasNumberSuffix(filename) {
  // "5554 Bordeaux 2.jpg" → true  |  "5554 Bordeaux.jpg" → false
  return /\s\d+\.[a-z]+$/i.test(filename)
}

// Para cada código, elige el archivo preferido (sin sufijo numérico primero)
function buildBestMap(files) {
  const map = new Map() // code → filename
  for (const f of files) {
    const code = parseCode(f)
    if (!code) continue
    const ext = extname(f).toLowerCase()
    if (!MIME[ext]) continue

    const existing = map.get(code)
    if (!existing) { map.set(code, f); continue }

    // Prefiere el que NO tiene sufijo numérico
    const existingHasSuffix = hasNumberSuffix(existing)
    const newHasSuffix = hasNumberSuffix(f)
    if (existingHasSuffix && !newHasSuffix) map.set(code, f)
    // Si ambos tienen o ambos no tienen sufijo, queda el primero
  }
  return map
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mantenanceDB'
  console.log(`Conectando a ${uri}...`)
  await mongoose.connect(uri)
  console.log('Conectado.\n')

  const files = readdirSync(IMAGES_DIR)
  const bestMap = buildBestMap(files)
  console.log(`Imágenes encontradas: ${files.length} archivos → ${bestMap.size} códigos únicos\n`)

  const colors = await Color.find({})
  console.log(`Colores en BD: ${colors.length}\n`)

  let updated = 0, skipped = 0, notFound = 0

  for (const [code, filename] of bestMap) {
    const color = colors.find(c => c.code === code)
    if (!color) {
      console.log(`  [NO MATCH] ${code} — ${filename}`)
      notFound++
      continue
    }

    const filePath = resolve(IMAGES_DIR, filename)
    const ext = extname(filename).toLowerCase()
    const mimetype = MIME[ext]
    const buffer = readFileSync(filePath)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${mimetype};base64,${base64}`
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`

    const fileDoc = await File.create({
      filename: unique,
      originalName: filename,
      mimetype,
      data: dataUri,
      size: buffer.length,
    })

    color.image = `/api/files/${fileDoc._id}`
    await color.save()

    console.log(`  [OK] ${code} — ${color.name}  →  ${color.image}`)
    updated++
  }

  console.log(`\n✓ Actualizados: ${updated}`)
  console.log(`  Sin match:    ${notFound}`)
  console.log(`  Saltados:     ${skipped}`)

  await mongoose.disconnect()
  console.log('\nConexión cerrada.')
}

main().catch(err => { console.error(err); process.exit(1) })
