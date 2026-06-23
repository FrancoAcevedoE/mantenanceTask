import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

// ─── Inline schemas ───────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  colors: [{ type: String }],
  dimensions: { type: String },
  thicknesses: [{ type: String }],
  pricePerM2: { type: Number, default: null },
  image: { type: String },
  grupo: { type: String },
  tipo: { type: String },
  terminacion: { type: String },
  precioGrupoI: { type: Number },
  precioGrupoII: { type: Number },
  precioGrupoIII: { type: Number },
  precioEscolares: { type: Number },
  unidadPrecio: { type: String, default: 'm2' },
  comentario: { type: String },
  produccionMinima: { type: Number, default: null },
  admiteDescuentos: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
}, { strict: false })

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

const Product = mongoose.model('Product', productSchema)
const ProductGroup = mongoose.model('ProductGroup', productGroupSchema)

// ─── Helper: concatenar dos descuentos porcentuales ──────────────────────────
// Resultado = (1 - (1-a/100)(1-b/100)) * 100  redondeado a 2 decimales
function concat(a, b) {
  return Math.round((1 - (1 - a / 100) * (1 - b / 100)) * 10000) / 100
}

// ─── LAMINADOS DECORATIVOS — tabla de descuentos ──────────────────────────────
//
//  Tabla original:
//    30-80 hojas:    15% dto cantidad | 8% contado | 4% a 30 días f.f.
//    81-160 hojas:   19%              | 8%         | 4%
//    161-270 hojas:  23%              | 8%         | 4%
//    271-500 hojas:  27%              | 8%         | 4%
//    > 500 hojas:    27% + 25%        | 8%         | 4%
//
//  Concatenación en cascada: p_final = precio * (1-dto_cantidad) * (1-dto_pago)
//  Ej. 30-80 + contado: 1 - (0.85 × 0.92) = 21.80%

const descuentosLaminados = [
  {
    desdeHojas: 30,  hastaHojas: 80,
    porcCantidad: 15, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(15, 8),   // 21.80%
    porcCantidad30dias:  concat(15, 4),   // 18.40%
  },
  {
    desdeHojas: 81,  hastaHojas: 160,
    porcCantidad: 19, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(19, 8),   // 25.48%
    porcCantidad30dias:  concat(19, 4),   // 22.24%
  },
  {
    desdeHojas: 161, hastaHojas: 270,
    porcCantidad: 23, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(23, 8),   // 29.16%
    porcCantidad30dias:  concat(23, 4),   // 26.08%
  },
  {
    desdeHojas: 271, hastaHojas: 500,
    porcCantidad: 27, porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(27, 8),   // 32.84%
    porcCantidad30dias:  concat(27, 4),   // 29.92%
  },
  {
    desdeHojas: 501, hastaHojas: null,
    porcCantidad: concat(27, 25),         // 45.25%  (27%+25% en cascada)
    porcContado: 8, porc30dias: 4,
    porcCantidadContado: concat(concat(27, 25), 8),  // 49.63%
    porcCantidad30dias:  concat(concat(27, 25), 4),  // 47.44%
    nota: '27% + 25% aplicados en cascada',
  },
]

// ─── LAMINADOS DECORATIVOS — productos (25) ───────────────────────────────────

// unidadPrecio = 'lámina' porque grupo I/II/III/escolares son precios POR UNIDAD (por lámina), no por m²
// La columna "por m2" del Excel está separada y es pricePerM2 (vacía en casi todos estos productos)

const products = [
  // ── Contrachapa ────────────────────────────────────────────────────────────
  {
    code: 'LAM-001', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Contrachapa Blanca', terminacion: 'Brillante',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 25.1, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-002', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Contrachapa Blanca', terminacion: 'Semimate',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 28.5, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-003', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Contrachapa', terminacion: 'Industrial',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 23.4, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-004', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Contrachapa Especial', terminacion: 'Especial',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 27.8, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },

  // ── Con precios por grupo (guía de descuentos) ─────────────────────────────
  {
    code: 'LAM-005', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Vertical', terminacion: null,
    colors: ['5532', '5529', '5534', '5558'],
    dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 50.8, precioGrupoII: 56, precioGrupoIII: 61.1, precioEscolares: 48.3,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-006', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: 'Karipol', terminacion: null,
    colors: ['5532', '5529', '5534', '5558'],
    dimensions: '1220 x 3060 mm', thicknesses: ['0.8'],
    precioGrupoI: 61.1, precioGrupoII: 66.3, precioGrupoIII: 71.2, precioEscolares: 58.1,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-007', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: null, terminacion: null,
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['1'],
    precioGrupoI: 67.8, precioGrupoII: 71.2, precioGrupoIII: 78.1,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-008', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Decorativo',
    tipo: null, terminacion: null,
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['1.2'],
    precioGrupoI: 78.1, precioGrupoII: 83.3, precioGrupoIII: 88.2,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },

  // ── Pizarrones ─────────────────────────────────────────────────────────────
  {
    code: 'LAM-009', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Pizarron (tiza/textura/karipol)',
    tipo: 'Laminado decorativo de alta presión', terminacion: null,
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: [],
    precioGrupoIII: 74.8, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-010', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Pizarron (marcador/brillo/karipol)',
    tipo: 'Laminado decorativo de alta presión', terminacion: null,
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: [],
    precioGrupoIII: 67.8, unidadPrecio: 'lámina',
    comentario: '10 unidades por caja',
  },

  // ── Postformable ───────────────────────────────────────────────────────────
  {
    code: 'LAM-011', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Postformable',
    tipo: 'Vertical', terminacion: null,
    colors: ['5532', '5529', '5534', '5558'],
    dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 59.3, precioGrupoII: 64.5, precioGrupoIII: 73.3, precioEscolares: 56.4,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-012', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Postformable',
    tipo: 'Karipol', terminacion: null,
    colors: ['5532', '5529', '5534', '5558'],
    dimensions: '1220 x 3060 mm', thicknesses: ['0.8'],
    precioGrupoI: 69.6, precioGrupoII: 71.1, precioGrupoIII: 78.1, precioEscolares: 66.2,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },

  // ── Especiales — NO ADMITEN DESCUENTOS ────────────────────────────────────
  {
    code: 'LAM-013', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados Especiales',
    tipo: null, terminacion: 'Metalic Escobado',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.6'],
    precioGrupoI: 164.5, unidadPrecio: 'lámina',
    comentario: 'NO ADMITEN DESCUENTOS, 10 unidades por caja',
    admiteDescuentos: false,
  },
  {
    code: 'LAM-014', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados Especiales',
    tipo: null, terminacion: 'Metalic Champagne/Orange',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['0.8'],
    precioGrupoI: 164.5, unidadPrecio: 'lámina',
    comentario: 'NO ADMITEN DESCUENTOS, 10 unidades por caja',
    admiteDescuentos: false,
  },
  {
    code: 'LAM-015', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados Especiales',
    tipo: null, terminacion: 'Pizarrón magnético 1 mm',
    colors: [], dimensions: '1220 x 3060 mm', thicknesses: ['1'],
    precioGrupoI: 179.9, unidadPrecio: 'lámina',
    comentario: 'NO ADMITEN DESCUENTOS, 10 unidades por caja',
    admiteDescuentos: false,
  },

  // ── Laminado Recto ─────────────────────────────────────────────────────────
  {
    code: 'LAM-016', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Recto',
    tipo: null, terminacion: 'Brillante - Mate - Mate pp',
    colors: ['Todos'], dimensions: '1220 x 2440 mm', thicknesses: ['0.8'],
    precioGrupoI: 56.1, precioGrupoII: 60.8, precioGrupoIII: 65.3,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },
  {
    code: 'LAM-017', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminado Recto',
    tipo: null, terminacion: 'Poro madera, Madera, Trama, Concreto',
    colors: ['Todos'], dimensions: '1220 x 2440 mm', thicknesses: ['0.8'],
    precioGrupoI: 67.3, precioGrupoII: 73, precioGrupoIII: 78.4,
    unidadPrecio: 'lámina', comentario: '10 unidades por caja',
  },

  // ── Film Protector ─────────────────────────────────────────────────────────
  {
    code: 'LAM-018', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Film Protector',
    tipo: null, terminacion: null,
    colors: [], dimensions: null, thicknesses: [],
    precioGrupoI: 4.4, unidadPrecio: 'lámina',
  },

  // ── Laminados rectos (precio = +20% sobre placa común) ────────────────────
  {
    code: 'LAM-019', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Brillante - texturizado - polipropileno',
    colors: ['5532', '5505'], dimensions: '915 x 2440 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 400,
  },
  {
    code: 'LAM-020', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Brillante - texturizado - polipropileno',
    colors: ['5100', '5161', '5132', '5120', '5123', '5126'],
    dimensions: '915 x 3060 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 10,
  },
  {
    code: 'LAM-021', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Brillante - mate - texturizado - polipropileno',
    colors: ['Todos'], dimensions: '1220 x 2440 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
  },
  {
    code: 'LAM-022', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Brillante - texturizado',
    colors: ['Todos'], dimensions: '1220 x 3060 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 10,
  },
  {
    code: 'LAM-023', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Semimate',
    colors: ['Todos'], dimensions: '1220 x 3060 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 40,
  },
  {
    code: 'LAM-024', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Frost',
    colors: ['Todos'], dimensions: '1220 x 3060 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 50,
  },
  {
    code: 'LAM-025', grupo: 'LAMINADOS DECORATIVOS',
    name: 'Laminados rectos',
    tipo: null, terminacion: 'Diagonal',
    colors: ['Todos'], dimensions: '1220 x 3060 mm', thicknesses: [],
    unidadPrecio: 'lámina',
    comentario: '20% adicional al precio x m2 de la placa común, 10 unidades por caja',
    produccionMinima: 50,
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('MONGODB_URI no encontrada en .env'); process.exit(1) }

  await mongoose.connect(uri)
  console.log('Conectado a MongoDB\n')

  let ok = 0, errors = 0
  for (const p of products) {
    try {
      await Product.findOneAndUpdate({ code: p.code }, { $set: p }, { upsert: true })
      const label = [p.tipo, p.terminacion, p.thicknesses?.[0] ? p.thicknesses[0] + 'mm' : ''].filter(Boolean).join(' · ')
      process.stdout.write(`  ✓ ${p.code} [${p.grupo}] ${p.name}${label ? ' — ' + label : ''}\n`)
      ok++
    } catch (e) {
      console.error(`  ✗ ${p.code}: ${e.message}`)
      errors++
    }
  }

  console.log('\nGuardando tabla de descuentos del grupo...')
  await ProductGroup.findOneAndUpdate(
    { nombre: 'LAMINADOS DECORATIVOS' },
    { $set: { nombre: 'LAMINADOS DECORATIVOS', descuentos: descuentosLaminados } },
    { upsert: true }
  )
  console.log('  ✓ LAMINADOS DECORATIVOS — descuentos guardados')
  console.log('\n  Resumen concatenaciones:')
  for (const t of descuentosLaminados) {
    const rango = t.hastaHojas ? `${t.desdeHojas}–${t.hastaHojas}` : `>${t.desdeHojas - 1}`
    console.log(`    ${rango.padEnd(10)} ${String(t.porcCantidad).padStart(6)}% cant | +contado: ${t.porcCantidadContado}% | +30días: ${t.porcCantidad30dias}%`)
  }

  console.log(`\nCompletado: ${ok} productos, ${errors} errores`)
  await mongoose.disconnect()
}

seed().catch(e => { console.error('Error:', e); process.exit(1) })
