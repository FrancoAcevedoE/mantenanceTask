import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const tramoSchema = new mongoose.Schema({
  desdeHojas: Number,
  hastaHojas: { type: Number, default: null },
  porcCantidad: Number,
  porcContado: Number,
  porc30dias: Number,
  porcCantidadContado: Number,
  porcCantidad30dias: Number,
  nota: String,
}, { _id: false })

const productGroupSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descuentos: [tramoSchema],
  notas: String,
}, { timestamps: true })

const ProductGroup = mongoose.model('ProductGroup', productGroupSchema)

function concat(a, b) {
  return Math.round((1 - (1 - a / 100) * (1 - b / 100)) * 10000) / 100
}

// ─── KARIPLAC H y MAX — tabla de descuentos ──────────────────────────────────
const descuentosKariplacHyMAX = [
  {
    desdeHojas: 1,   hastaHojas: 30,
    porcCantidad: 15, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(15, 8),
    porcCantidad30dias:  concat(15, 4),
  },
  {
    desdeHojas: 31,  hastaHojas: 60,
    porcCantidad: 19, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(19, 8),
    porcCantidad30dias:  concat(19, 4),
  },
  {
    desdeHojas: 61,  hastaHojas: 150,
    porcCantidad: 23, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(23, 8),
    porcCantidad30dias:  concat(23, 4),
  },
  {
    desdeHojas: 151, hastaHojas: null,
    porcCantidad: 27, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(27, 8),
    porcCantidad30dias:  concat(27, 4),
  },
]

// ─── LAMINADOS DECORATIVOS — tabla de descuentos ─────────────────────────────
const descuentosLaminados = [
  {
    desdeHojas: 30,  hastaHojas: 80,
    porcCantidad: 15, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(15, 8),
    porcCantidad30dias:  concat(15, 4),
  },
  {
    desdeHojas: 81,  hastaHojas: 160,
    porcCantidad: 19, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(19, 8),
    porcCantidad30dias:  concat(19, 4),
  },
  {
    desdeHojas: 161, hastaHojas: 270,
    porcCantidad: 23, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(23, 8),
    porcCantidad30dias:  concat(23, 4),
  },
  {
    desdeHojas: 271, hastaHojas: 500,
    porcCantidad: 27, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(27, 8),
    porcCantidad30dias:  concat(27, 4),
  },
  {
    desdeHojas: 501, hastaHojas: null,
    porcCantidad: concat(27, 25),
    porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(concat(27, 25), 8),
    porcCantidad30dias:  concat(concat(27, 25), 4),
    nota: '27% + 25% aplicados en cascada',
  },
]

// ─── KARIPLAC MDP — tabla de descuentos ──────────────────────────────────────
const descuentosKariplacMDP = [
  {
    desdeHojas: 10,  hastaHojas: 25,
    porcCantidad: 15, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(15, 8),
    porcCantidad30dias:  concat(15, 4),
  },
  {
    desdeHojas: 26,  hastaHojas: 50,
    porcCantidad: 19, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(19, 8),
    porcCantidad30dias:  concat(19, 4),
  },
  {
    desdeHojas: 51,  hastaHojas: 200,
    porcCantidad: 23, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(23, 8),
    porcCantidad30dias:  concat(23, 4),
  },
  {
    desdeHojas: 201, hastaHojas: null,
    porcCantidad: 27, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(27, 8),
    porcCantidad30dias:  concat(27, 4),
  },
]

// ─── KARIPLAC MDF — tabla de descuentos ──────────────────────────────────────
const descuentosKariplacMDF = [
  {
    desdeHojas: 10,  hastaHojas: 25,
    porcCantidad: 15, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(15, 8),
    porcCantidad30dias:  concat(15, 4),
  },
  {
    desdeHojas: 26,  hastaHojas: 50,
    porcCantidad: 19, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(19, 8),
    porcCantidad30dias:  concat(19, 4),
  },
  {
    desdeHojas: 51,  hastaHojas: 200,
    porcCantidad: 23, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(23, 8),
    porcCantidad30dias:  concat(23, 4),
  },
  {
    desdeHojas: 201, hastaHojas: null,
    porcCantidad: 27, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(27, 8),
    porcCantidad30dias:  concat(27, 4),
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('MONGODB_URI no encontrada en .env'); process.exit(1) }

  await mongoose.connect(uri)
  console.log('Conectado a MongoDB\n')

  console.log('Guardando tablas de descuentos...')

  const grupos = [
    { nombre: 'LAMINADOS DECORATIVOS', descuentos: descuentosLaminados },
    { nombre: 'KARIPLAC MDP', descuentos: descuentosKariplacMDP },
    { nombre: 'KARIPLAC MDF', descuentos: descuentosKariplacMDF },
    { nombre: 'KARIPLAK H', descuentos: descuentosKariplacHyMAX },
    { nombre: 'KARIPLAK MAX', descuentos: descuentosKariplacHyMAX },
  ]
  for (const g of grupos) {
    await ProductGroup.findOneAndUpdate(
      { nombre: g.nombre },
      { $set: g },
      { upsert: true }
    )
    console.log(`  ✓ ${g.nombre} — descuentos guardados`)
    for (const t of g.descuentos) {
      const rango = t.hastaHojas ? `${t.desdeHojas}–${t.hastaHojas}` : `>${t.desdeHojas - 1}`
      console.log(`    ${rango.padEnd(10)} ${String(t.porcCantidad).padStart(6)}% cant | +contado: ${t.porcCantidadContado}% | +30días: ${t.porcCantidad30dias}%`)
    }
  }

  console.log('\nCompletado')
  await mongoose.disconnect()
}

seed().catch(e => { console.error('Error:', e); process.exit(1) })
