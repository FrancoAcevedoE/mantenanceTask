import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Proveedor from '../models/proveedorModel.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const PROVEEDORES = [
  { nombre: 'A TONAL',             categoria: 'Aditivos / Tintas',    perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ADELFA',              categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'AMSI',                categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Baja (Tipo C)' },
  { nombre: 'ARAUCO',              categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ARCOR',               categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ARKEMA',              categoria: 'Films',                 perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ARTECOLA',            categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ATANOR',              categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'BBB EXPRESS',         categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Media (Tipo B)' },
  { nombre: 'CAIEIRAS',            categoria: 'Papeles',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'CARGHILL',            categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'CAZ SAS',             categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Baja (Tipo C)' },
  { nombre: 'CUYOPLACAS',          categoria: 'Maderas',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ENTRO CORP.',         categoria: 'Química / Papeles',     perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'ESKAS',               categoria: 'Química',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'EXPRESIO BRIO',       categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Media (Tipo B)' },
  { nombre: 'FAPLAC',              categoria: 'Maderas',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'FERON',               categoria: 'Foils',                 perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'FIPLASTO',            categoria: 'Maderas',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'FLEXOTINT',           categoria: 'Tintas',                perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'FRADEALCO',           categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'GLATFELTER',          categoria: 'Papeles',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'HEBEI',               categoria: 'Maderas',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'IMPRESS DECOR',       categoria: 'Papeles',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'INQUIMEX',            categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'KEKOL',               categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'KOTKAMILLS',          categoria: 'Papeles',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'LAMINADOS DO BRASIL', categoria: 'Aditivos / Maderas',    perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'LUMPACK',             categoria: 'Tintas',                perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'MATERFLEX',           categoria: 'Films',                 perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'MTL',                 categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Media (Tipo B)' },
  { nombre: 'MUNKSJO',             categoria: 'Papeles',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'NATH',                categoria: 'Papeles',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'PM',                  categoria: 'Papeles',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'POLYVANTIS',          categoria: 'Films',                 perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'PORTA HNOS',          categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'PROTEFILM',           categoria: 'Films',                 perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'RESINAS CONCORDIA',   categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'RHODIA',              categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'SASOL',               categoria: 'Química',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'SCHATTDECOR',         categoria: 'Papeles',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'SCHWARTZ VRENA',      categoria: 'Maderas',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'SESA',                categoria: 'Maderas',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'SZCHIMER',            categoria: 'Aditivos',              perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'TECHNOCELL',          categoria: 'Papeles',               perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'TNS',                 categoria: 'Aditivos',              perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'TRUPAN',              categoria: 'Maderas',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'TYC',                 categoria: 'Servicios',             perfil: 'Servicios/Fletes',   criticidad: 'Media (Tipo B)' },
  { nombre: 'VILLA GUILLERMINA',   categoria: 'Maderas',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'WIZ CHEMICALS',       categoria: 'Aditivos',              perfil: 'Internacional',      criticidad: 'Alta (Tipo A)' },
  { nombre: 'YPF',                 categoria: 'Química',               perfil: 'Local Insumos',      criticidad: 'Alta (Tipo A)' },
]

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mantenanceDB'
  await mongoose.connect(uri)
  console.log('MongoDB conectado')

  let created = 0, skipped = 0
  for (const p of PROVEEDORES) {
    const exists = await Proveedor.findOne({ nombre: p.nombre, activo: true })
    if (exists) {
      // Update perfil/criticidad if missing
      if (!exists.perfil || !exists.criticidad) {
        await Proveedor.findByIdAndUpdate(exists._id, { perfil: p.perfil, criticidad: p.criticidad, categoria: p.categoria })
        console.log(`  Actualizado: ${p.nombre}`)
      } else {
        console.log(`  Ya existe:   ${p.nombre}`)
      }
      skipped++
    } else {
      await Proveedor.create({ ...p, activo: true })
      console.log(`  Creado:      ${p.nombre}`)
      created++
    }
  }

  console.log(`\nListo: ${created} creados, ${skipped} ya existían`)
  await mongoose.disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
