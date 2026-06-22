import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  colors: [{ type: String }],
  dimensions: { type: String },
  thicknesses: [{ type: String }],
  pricePerM2: { type: Number, required: true },
  discounts: [{ quantity: Number, discountPercent: Number }],
  image: { type: String },
  grupo: { type: String },
  terminacion: { type: String },
  textura: { type: String },
  tipo: { type: String },
  comentario: { type: String },
  precioGrupoI: { type: Number },
  precioGrupoII: { type: Number },
  precioGrupoIII: { type: Number },
  precioEscolares: { type: Number },
  unidadPrecio: { type: String, default: 'm2' },
  stock: { type: Number, default: 0 },
}, { strict: false })

const Product = mongoose.model('Product', productSchema)

const products = [
  // ─── LAMINADO DECORATIVO ──────────────────────────────────────────────────
  { code: 'LAM-001', name: 'Laminado decorativo alta presión — Contrachapa Blanca Brillante', tipo: 'Laminado decorativo', terminacion: 'Brillante', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 25.1, colors: [] },
  { code: 'LAM-002', name: 'Laminado decorativo alta presión — Contrachapa Blanca Semimate', tipo: 'Laminado decorativo', terminacion: 'Semimate', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 28.5, colors: [] },
  { code: 'LAM-003', name: 'Laminado decorativo alta presión — Contrachapa Industrial', tipo: 'Laminado decorativo', terminacion: 'Industrial', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 23.4, colors: [] },
  { code: 'LAM-004', name: 'Laminado decorativo alta presión — Contrachapa Especial', tipo: 'Laminado decorativo', terminacion: 'Especial', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 27.8, colors: [] },
  { code: 'LAM-005', name: 'Laminado decorativo alta presión — Vertical 0.6mm', tipo: 'Laminado decorativo', terminacion: 'Vertical', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 50.8, precioGrupoI: 50.8, precioGrupoII: 56, precioGrupoIII: 61.1, precioEscolares: 48.3, colors: ['5532 Gris Tiza', '5529 Platino', '5534 Almendra', '5558'] },
  { code: 'LAM-006', name: 'Laminado decorativo alta presión — Karipol 0.8mm', tipo: 'Laminado decorativo', terminacion: 'Karipol', dimensions: '1220 x 3060 mm', thicknesses: ['0.8mm'], pricePerM2: 61.1, precioGrupoI: 61.1, precioGrupoII: 66.3, precioGrupoIII: 71.2, precioEscolares: 58.1, colors: ['5532 Gris Tiza', '5529 Platino', '5534 Almendra', '5558'] },
  { code: 'LAM-007', name: 'Laminado decorativo alta presión — 1mm', tipo: 'Laminado decorativo', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['1mm'], pricePerM2: 67.8, precioGrupoI: 67.8, precioGrupoII: 71.2, precioGrupoIII: 78.1, colors: [] },
  { code: 'LAM-008', name: 'Laminado decorativo alta presión — 1.2mm', tipo: 'Laminado decorativo', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['1.2mm'], pricePerM2: 78.1, precioGrupoI: 78.1, precioGrupoII: 83.3, precioGrupoIII: 88.2, colors: [] },
  { code: 'LAM-009', name: 'Pizarrón Tiza/Textura/Karipol — Laminado', tipo: 'Laminado decorativo', terminacion: 'Textura', dimensions: '1220 x 3060 mm', thicknesses: ['-'], pricePerM2: 74.8, colors: [] },
  { code: 'LAM-010', name: 'Pizarrón Marcador/Brillo/Karipol — Laminado', tipo: 'Laminado decorativo', terminacion: 'Brillante', dimensions: '1220 x 3060 mm', thicknesses: ['-'], pricePerM2: 67.8, colors: [] },
  { code: 'LAM-011', name: 'Laminado Postformable — Vertical 0.6mm', tipo: 'Laminado decorativo', terminacion: 'Vertical', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 59.3, precioGrupoI: 59.3, precioGrupoII: 64.5, precioGrupoIII: 73.3, precioEscolares: 56.4, colors: ['5532 Gris Tiza', '5529 Platino', '5534 Almendra', '5558'] },
  { code: 'LAM-012', name: 'Laminado Postformable — Karipol 0.8mm', tipo: 'Laminado decorativo', terminacion: 'Karipol', dimensions: '1220 x 3060 mm', thicknesses: ['0.8mm'], pricePerM2: 69.6, precioGrupoI: 69.6, precioGrupoII: 71.1, precioGrupoIII: 78.1, precioEscolares: 66.2, colors: ['5532 Gris Tiza', '5529 Platino', '5534 Almendra', '5558'] },
  { code: 'LAM-013', name: 'Laminado Especial — Metalic Escobado 0.6mm', tipo: 'Laminado decorativo', terminacion: 'Metalic Escobado', dimensions: '1220 x 3060 mm', thicknesses: ['0.6mm'], pricePerM2: 164.5, colors: [] },
  { code: 'LAM-014', name: 'Laminado Especial — Metalic Champagne/Orange 0.8mm', tipo: 'Laminado decorativo', terminacion: 'Metalic', dimensions: '1220 x 3060 mm', thicknesses: ['0.8mm'], pricePerM2: 164.5, colors: [] },
  { code: 'LAM-015', name: 'Laminado Especial — Pizarrón magnético 1mm', tipo: 'Laminado decorativo', terminacion: 'Magnético', dimensions: '1220 x 3060 mm', thicknesses: ['1mm'], pricePerM2: 179.9, colors: [] },
  { code: 'LAM-016', name: 'Laminado Recto — Brillante/Mate 0.8mm (1220x2440)', tipo: 'Laminado decorativo', terminacion: 'Brillante - Mate', dimensions: '1220 x 2440 mm', thicknesses: ['0.8mm'], pricePerM2: 56.1, precioGrupoI: 56.1, precioGrupoII: 60.8, precioGrupoIII: 65.3, colors: ['Todos'] },
  { code: 'LAM-017', name: 'Laminado Recto — Poro madera/Madera/Trama/Concreto 0.8mm', tipo: 'Laminado decorativo', terminacion: 'Poro madera - Madera - Trama - Concreto', dimensions: '1220 x 2440 mm', thicknesses: ['0.8mm'], pricePerM2: 67.3, precioGrupoI: 67.3, precioGrupoII: 73, precioGrupoIII: 78.4, colors: ['Todos'] },
  { code: 'LAM-018', name: 'Film Protector', tipo: 'Laminado decorativo', terminacion: '-', dimensions: '-', thicknesses: ['-'], pricePerM2: 4.4, colors: [] },

  // ─── KARIPLAK MDP ─────────────────────────────────────────────────────────
  { code: 'KMP-001', name: 'Kariplac Melamina MDP — Blanco 2 caras 10mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['10mm'], pricePerM2: 12.9, colors: ['Blanco 5505'] },
  { code: 'KMP-002', name: 'Kariplac Melamina MDP — Blanco 1 cara 10mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['10mm'], pricePerM2: 11.8, colors: ['Blanco 5505'] },
  { code: 'KMP-003', name: 'Kariplac Melamina MDP — 5520 10mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['10mm'], pricePerM2: 14.5, colors: ['5520'] },
  { code: 'KMP-004', name: 'Kariplac Melamina MDP — Grupo 1/2/3 10mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['10mm'], pricePerM2: 16.5, colors: ['Grupo 1', 'Grupo 2', 'Grupo 3'] },
  { code: 'KMP-005', name: 'Kariplac Melamina MDP — Blanco 2 caras 15mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['15mm'], pricePerM2: 14.2, colors: ['Blanco 5505'] },
  { code: 'KMP-006', name: 'Kariplac Melamina MDP — Blanco 1 cara 15mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['15mm'], pricePerM2: 13.1, colors: ['Blanco 5505'] },
  { code: 'KMP-007', name: 'Kariplac Melamina MDP — 5520 15mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['15mm'], pricePerM2: 16.2, colors: ['5520'] },
  { code: 'KMP-008', name: 'Kariplac Melamina MDP — Grupo 1/2/3 15mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['15mm'], pricePerM2: 18.2, colors: ['Grupo 1', 'Grupo 2', 'Grupo 3'] },
  { code: 'KMP-009', name: 'Kariplac Melamina MDP — Blanco 2 caras 18mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['18mm'], pricePerM2: 15.5, colors: ['Blanco 5505'] },
  { code: 'KMP-010', name: 'Kariplac Melamina MDP — Blanco 1 cara 18mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['18mm'], pricePerM2: 14.5, colors: ['Blanco 5505'] },
  { code: 'KMP-011', name: 'Kariplac Melamina MDP — 5520 18mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['18mm'], pricePerM2: 17.5, colors: ['5520'] },
  { code: 'KMP-012', name: 'Kariplac Melamina MDP — Grupo 1/2/3 18mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['18mm'], pricePerM2: 19.7, colors: ['Grupo 1', 'Grupo 2', 'Grupo 3'] },
  { code: 'KMP-013', name: 'Kariplac Melamina MDP — Blanco 2 caras 24mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['24mm'], pricePerM2: 20.1, colors: ['Blanco 5505'] },
  { code: 'KMP-014', name: 'Kariplac Melamina MDP — Blanco 1 cara 24mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['24mm'], pricePerM2: 19.1, colors: ['Blanco 5505'] },
  { code: 'KMP-015', name: 'Kariplac Melamina MDP — 5520 24mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['24mm'], pricePerM2: 22.3, colors: ['5520'] },
  { code: 'KMP-016', name: 'Kariplac Melamina MDP — Grupo 1/2/3 24mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['24mm'], pricePerM2: 25, colors: ['Grupo 1', 'Grupo 2', 'Grupo 3'] },
  { code: 'KMP-017', name: 'Kariplac Melamina MDP — Blanco 2 caras 28mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['28mm'], pricePerM2: 24.7, colors: ['Blanco 5505'] },
  { code: 'KMP-018', name: 'Kariplac Melamina MDP — Blanco 1 cara 28mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['28mm'], pricePerM2: 23.7, colors: ['Blanco 5505'] },
  { code: 'KMP-019', name: 'Kariplac Melamina MDP — 5520 28mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['28mm'], pricePerM2: 26.9, colors: ['5520'] },
  { code: 'KMP-020', name: 'Kariplac Melamina MDP — Grupo 1/2/3 28mm', tipo: 'Kariplac MDP', terminacion: 'Soft y Mate', dimensions: '1850 x 2750/3050 mm', thicknesses: ['28mm'], pricePerM2: 29.6, colors: ['Grupo 1', 'Grupo 2', 'Grupo 3'] },

  // ─── KARIPLAK MDF ─────────────────────────────────────────────────────────
  { code: 'KMF-001', name: 'Kariplac Melamina MDF — 5520 9mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['9mm'], pricePerM2: 11.7, colors: ['5520'] },
  { code: 'KMF-002', name: 'Kariplac Melamina MDF — Colores grupo 9mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['9mm'], pricePerM2: 12.3, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-003', name: 'Kariplac Melamina MDF — 5520 12mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['12mm'], pricePerM2: 12.3, colors: ['5520'] },
  { code: 'KMF-004', name: 'Kariplac Melamina MDF — Colores grupo 12mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['12mm'], pricePerM2: 13, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-005', name: 'Kariplac Melamina MDF — 5520 15mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['15mm'], pricePerM2: 12.7, colors: ['5520'] },
  { code: 'KMF-006', name: 'Kariplac Melamina MDF — Colores grupo 15mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['15mm'], pricePerM2: 14.5, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-007', name: 'Kariplac Melamina MDF — 5520 18mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['18mm'], pricePerM2: 14.2, colors: ['5520'] },
  { code: 'KMF-008', name: 'Kariplac Melamina MDF — Colores grupo 18mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['18mm'], pricePerM2: 16, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-009', name: 'Kariplac Melamina MDF — 5520 24mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['24mm'], pricePerM2: 22.3, colors: ['5520'] },
  { code: 'KMF-010', name: 'Kariplac Melamina MDF — Colores grupo 24mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['24mm'], pricePerM2: 23.5, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-011', name: 'Kariplac Melamina MDF — 5520 30mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['30mm'], pricePerM2: 27, colors: ['5520'] },
  { code: 'KMF-012', name: 'Kariplac Melamina MDF — Colores grupo 30mm', tipo: 'Kariplac MDF', terminacion: 'Soft y Mate', dimensions: '1830 x 3660 mm', thicknesses: ['30mm'], pricePerM2: 28.6, colors: ['5093', '5095', '5067', '5094', '5071', '5534', '5532'] },
  { code: 'KMF-013', name: 'Kariplac Melamina Brasil MDF — 5520 15mm', tipo: 'Kariplac MDF', terminacion: 'Soft', dimensions: '1850 x 2750 mm', thicknesses: ['15mm'], pricePerM2: 8.8, colors: ['5520'], comentario: '44 hojas por pallet, mínimo 1 pallet' },
  { code: 'KMF-014', name: 'Kariplac Melamina Brasil MDF — 5520 18mm', tipo: 'Kariplac MDF', terminacion: 'Soft', dimensions: '1850 x 2750 mm', thicknesses: ['18mm'], pricePerM2: 10.4, colors: ['5520'], comentario: '36 hojas por pallet, mínimo 1 pallet' },

  // ─── KARIPLAK H Y MAX ─────────────────────────────────────────────────────
  { code: 'KHM-001', name: 'Kariplac H — Compensado Brillante/Semimate 3mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['3mm'], pricePerM2: 68.3, colors: ['Todos'] },
  { code: 'KHM-002', name: 'Kariplac H — Pizarrón Brillante/Semimate 3mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['3mm'], pricePerM2: 79.8, colors: ['Todos'] },
  { code: 'KHM-003', name: 'Kariplac H — Doble Faz 3mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate - Textura', dimensions: '1220 x 3050 mm', thicknesses: ['3mm'], pricePerM2: 81.9, precioGrupoI: 81.9, precioGrupoII: 88.2, colors: ['Todos'] },
  { code: 'KHM-004', name: 'Kariplac H — Compensado Brillante/Semimate 6mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['6mm'], pricePerM2: 99.8, colors: ['Todos'] },
  { code: 'KHM-005', name: 'Kariplac H — Pizarrón Brillante/Semimate 6mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['6mm'], pricePerM2: 112.4, colors: ['Todos'] },
  { code: 'KHM-006', name: 'Kariplac H — Doble Faz 6mm', tipo: 'Kariplac H', terminacion: 'Brillante - Semimate - Textura', dimensions: '1220 x 3050 mm', thicknesses: ['6mm'], pricePerM2: 113.4, precioGrupoI: 113.4, precioGrupoII: 120.8, colors: ['Todos'] },
  { code: 'KHM-007', name: 'Kariplac MAX — Compensado Brillante/Semimate 9mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['9mm'], pricePerM2: 135.5, colors: ['Todos'] },
  { code: 'KHM-008', name: 'Kariplac MAX — Pizarrón Brillante/Semimate 9mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['9mm'], pricePerM2: 149.1, colors: ['Todos'] },
  { code: 'KHM-009', name: 'Kariplac MAX — Doble Faz 9mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate - Textura', dimensions: '1220 x 3050 mm', thicknesses: ['9mm'], pricePerM2: 150.2, precioGrupoI: 150.2, precioGrupoII: 157.5, colors: ['Todos'] },
  { code: 'KHM-010', name: 'Kariplac MAX — Compensado Brillante/Semimate 12mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['12mm'], pricePerM2: 163.8, colors: ['Todos'] },
  { code: 'KHM-011', name: 'Kariplac MAX — Pizarrón Brillante/Semimate 12mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['12mm'], pricePerM2: 175.4, colors: ['Todos'] },
  { code: 'KHM-012', name: 'Kariplac MAX — Doble Faz 12mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate - Textura', dimensions: '1220 x 3050 mm', thicknesses: ['12mm'], pricePerM2: 177.5, precioGrupoI: 177.5, precioGrupoII: 184.8, colors: ['Todos'] },
  { code: 'KHM-013', name: 'Kariplac MAX — Compensado Brillante/Semimate 15mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['15mm'], pricePerM2: 214.2, colors: ['Todos'] },
  { code: 'KHM-014', name: 'Kariplac MAX — Pizarrón Brillante/Semimate 15mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate', dimensions: '1220 x 3050 mm', thicknesses: ['15mm'], pricePerM2: 224.7, colors: ['Todos'] },
  { code: 'KHM-015', name: 'Kariplac MAX — Doble Faz 15mm', tipo: 'Kariplac MAX', terminacion: 'Brillante - Semimate - Textura', dimensions: '1220 x 3050 mm', thicknesses: ['15mm'], pricePerM2: 227.9, precioGrupoI: 227.9, precioGrupoII: 234.2, colors: ['Todos'] },
  { code: 'KHM-016', name: 'Pizarrón Emplacado — Tiza 10mm', tipo: 'Kariplac H', terminacion: 'Tiza', dimensions: '1220 x 3060 mm', thicknesses: ['10mm'], pricePerM2: 147, colors: ['5513', '5500'] },
  { code: 'KHM-017', name: 'Pizarrón Emplacado — Marcador 10mm', tipo: 'Kariplac H', terminacion: 'Marcador', dimensions: '1220 x 3060 mm', thicknesses: ['10mm'], pricePerM2: 140, colors: ['5505'] },
  { code: 'KHM-018', name: 'Pizarrón Emplacado — Magnético 10mm', tipo: 'Kariplac H', terminacion: 'Magnético', dimensions: '1220 x 3060 mm', thicknesses: ['10mm'], pricePerM2: 312, colors: ['5505'] },
  { code: 'KHM-019', name: 'Pizarrón Emplacado — Tiza 15mm', tipo: 'Kariplac H', terminacion: 'Tiza', dimensions: '1220 x 3060 mm', thicknesses: ['15mm'], pricePerM2: 155, colors: ['5513', '5500'] },
  { code: 'KHM-020', name: 'Pizarrón Emplacado — Marcador 15mm', tipo: 'Kariplac H', terminacion: 'Marcador', dimensions: '1220 x 3060 mm', thicknesses: ['15mm'], pricePerM2: 149, colors: ['5505'] },
  { code: 'KHM-021', name: 'Pizarrón Emplacado — Magnético 15mm', tipo: 'Kariplac H', terminacion: 'Magnético', dimensions: '1220 x 3060 mm', thicknesses: ['15mm'], pricePerM2: 321, colors: ['5505'] },
  { code: 'KHM-022', name: 'Pizarrón Emplacado — Tiza 18mm', tipo: 'Kariplac H', terminacion: 'Tiza', dimensions: '1220 x 3060 mm', thicknesses: ['18mm'], pricePerM2: 163, colors: ['5513', '5500'] },
  { code: 'KHM-023', name: 'Pizarrón Emplacado — Marcador 18mm', tipo: 'Kariplac H', terminacion: 'Marcador', dimensions: '1220 x 3060 mm', thicknesses: ['18mm'], pricePerM2: 161, colors: ['5505'] },
  { code: 'KHM-024', name: 'Pizarrón Emplacado — Magnético 18mm', tipo: 'Kariplac H', terminacion: 'Magnético', dimensions: '1220 x 3060 mm', thicknesses: ['18mm'], pricePerM2: 332, colors: ['5505'] },
  { code: 'KHM-025', name: 'Pizarrón Emplacado Doble Faz — Tiza y Marcador 15mm', tipo: 'Kariplac H', terminacion: 'Tiza - Marcador', dimensions: '1220 x 3060 mm', thicknesses: ['15mm'], pricePerM2: 190, colors: ['5513', '5500', '5505'] },
  { code: 'KHM-026', name: 'Pizarrón Emplacado Doble Faz — Tiza y Marcador 18mm', tipo: 'Kariplac H', terminacion: 'Tiza - Marcador', dimensions: '1220 x 3060 mm', thicknesses: ['18mm'], pricePerM2: 195, colors: ['5513', '5500', '5505'] },

  // ─── KOMPAK ────────────────────────────────────────────────────────────────
  { code: 'KPK-001', name: 'Kompak Decorado — Simple Faz 2mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 96.6, colors: ['Todos'] },
  { code: 'KPK-002', name: 'Kompak Decorado — Simple Faz 3mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['3mm'], pricePerM2: 133.4, colors: ['Todos'] },
  { code: 'KPK-003', name: 'Kompak Decorado — Simple Faz 4mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['4mm'], pricePerM2: 176.4, colors: ['Todos'] },
  { code: 'KPK-004', name: 'Kompak Decorado — Simple Faz 6mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 251, colors: ['Todos'] },
  { code: 'KPK-005', name: 'Kompak Decorado — Simple Faz 8mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['8mm'], pricePerM2: 337.1, colors: ['Todos'] },
  { code: 'KPK-006', name: 'Kompak Decorado — Simple Faz 10mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['10mm'], pricePerM2: 410.6, colors: ['Todos'] },
  { code: 'KPK-007', name: 'Kompak Decorado — Simple Faz 15mm (1220x3060)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 3060 mm', thicknesses: ['15mm'], pricePerM2: 615.3, colors: ['Todos'] },
  { code: 'KPK-008', name: 'Kompak Decorado — Simple Faz 2mm (1220x2440)', tipo: 'Kompak', terminacion: 'Simple Faz', dimensions: '1220 x 2440 mm', thicknesses: ['2mm'], pricePerM2: 85.1, colors: ['Todos'] },
  { code: 'KPK-009', name: 'Kompak Decorado — Doble Faz 2mm (1220x3060)', tipo: 'Kompak', terminacion: 'Doble Faz', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 102.9, colors: ['Todos'] },
  { code: 'KPK-010', name: 'Kompak Decorado — Doble Faz 6mm (1220x3060)', tipo: 'Kompak', terminacion: 'Doble Faz', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 257.3, colors: ['Todos'] },
  { code: 'KPK-011', name: 'Kompak Film UV (1220x3060)', tipo: 'Kompak', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['-'], pricePerM2: 47.3, colors: [] },

  // ─── KOMPAK UNICOLOR ──────────────────────────────────────────────────────
  { code: 'KPU-001', name: 'Kompak Unicolor — Blanco 1mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['1mm'], pricePerM2: 87.2, colors: ['Blanco'] },
  { code: 'KPU-002', name: 'Kompak Unicolor — Blanco 2mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 171.2, colors: ['Blanco'] },
  { code: 'KPU-003', name: 'Kompak Unicolor — Blanco 3mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['3mm'], pricePerM2: 255.2, colors: ['Blanco'] },
  { code: 'KPU-004', name: 'Kompak Unicolor — Blanco 6mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 509.2, colors: ['Blanco'] },
  { code: 'KPU-005', name: 'Kompak Unicolor — Blanco 10mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['10mm'], pricePerM2: 781.2, colors: ['Blanco'] },
  { code: 'KPU-006', name: 'Kompak Unicolor — Negro 1mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['1mm'], pricePerM2: 76.7, colors: ['Negro'] },
  { code: 'KPU-007', name: 'Kompak Unicolor — Negro 6mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 449.4, colors: ['Negro'] },
  { code: 'KPU-008', name: 'Kompak Unicolor — 5532/5534/5528 2mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 190.1, colors: ['5532 Gris Tiza', '5534 Almendra', '5528'] },
  { code: 'KPU-009', name: 'Kompak Unicolor — 5532/5534/5528 6mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 564.9, colors: ['5532 Gris Tiza', '5534 Almendra', '5528'] },
  { code: 'KPU-010', name: 'Kompak Unicolor — 5525/5562/5554 2mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 233.1, colors: ['5525', '5562', '5554'] },
  { code: 'KPU-011', name: 'Kompak Unicolor — 5525/5562/5554 6mm', tipo: 'Kompak Unicolor', terminacion: 'Todas', dimensions: '1220 x 3060 mm', thicknesses: ['6mm'], pricePerM2: 692, colors: ['5525', '5562', '5554'] },

  // ─── ACUSTIK ──────────────────────────────────────────────────────────────
  { code: 'ACU-001', name: 'Kariplac Acustik Nacional — 15mm', tipo: 'Acustik', terminacion: 'Todas', dimensions: '595 x 1800 mm', thicknesses: ['15mm'], pricePerM2: 77.7, colors: ['Todas'], comentario: 'Superficie cubierta 1.04m² por panel' },
  { code: 'ACU-002', name: 'Kariplac Acustik Brasil Ease — 15mm', tipo: 'Acustik', terminacion: 'Soft', dimensions: '274 x 1750 mm', thicknesses: ['15mm'], pricePerM2: 56, colors: ['Aliguieri', 'Nogal', 'Watambu'] },
  { code: 'ACU-003', name: 'Kariplac Acustik Brasil Silent — 15mm', tipo: 'Acustik', terminacion: 'Soft', dimensions: '274 x 1750 mm', thicknesses: ['15mm'], pricePerM2: 51, colors: ['Aliguieri', 'Nogal', 'Watambu'] },
  { code: 'ACU-004', name: 'Kariplac Acustik Brasil Sonic — 15mm', tipo: 'Acustik', terminacion: 'Soft', dimensions: '274 x 1750 mm', thicknesses: ['15mm'], pricePerM2: 51, colors: ['Aliguieri', 'Nogal', 'Watambu'] },

  // ─── TOP FLOOR PISOS ──────────────────────────────────────────────────────
  { code: 'TFL-001', name: 'Top Floor Advance — HDF 9mm (5005)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5005'] },
  { code: 'TFL-002', name: 'Top Floor Advance — HDF 9mm (5013)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5013'] },
  { code: 'TFL-003', name: 'Top Floor Advance — HDF 9mm (5019)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5019'] },
  { code: 'TFL-004', name: 'Top Floor Advance — HDF 9mm (5021)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5021'] },
  { code: 'TFL-005', name: 'Top Floor Advance — HDF 9mm (5022)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5022'] },
  { code: 'TFL-006', name: 'Top Floor Advance — HDF 9mm (5024)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 20.2, colors: ['5024'] },
  { code: 'TFL-007', name: 'Top Floor Advance Zócalo — HDF 15mm', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '75 x 3040 mm', thicknesses: ['15mm'], pricePerM2: 5.5, colors: ['-'], unidadPrecio: 'unidad' },
  { code: 'TFL-008', name: 'Top Floor Premium — HDF 9mm (5008)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 22.2, colors: ['5008'] },
  { code: 'TFL-009', name: 'Top Floor Premium — HDF 9mm (5011)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 22.2, colors: ['5011'] },
  { code: 'TFL-010', name: 'Top Floor Premium — HDF 9mm (5012)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 22.2, colors: ['5012'] },
  { code: 'TFL-011', name: 'Top Floor Premium — HDF 9mm (5025)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 22.2, colors: ['5025'] },
  { code: 'TFL-012', name: 'Top Floor Premium — HDF 9mm (5053)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 22.2, colors: ['5053'] },
  { code: 'TFL-013', name: 'Top Floor Premium — HDF 9mm (5006)', tipo: 'Top Floor', terminacion: 'Soft', dimensions: '186 x 1195 mm', thicknesses: ['9mm'], pricePerM2: 23.1, colors: ['5006'] },
  { code: 'TFL-014', name: 'Top Floor Sobreelevado — Crudo/Industrial 36mm', tipo: 'Top Floor', terminacion: 'Crudo - Industrial', dimensions: '600 x 600 mm', thicknesses: ['36mm'], pricePerM2: 24.4, colors: ['-'], unidadPrecio: 'unidad', comentario: 'Opción borde PVC +7.4 USD' },
  { code: 'TFL-015', name: 'Top Floor Sobreelevado — Melamina industrial 36mm', tipo: 'Top Floor', terminacion: 'Melamina industrial', dimensions: '600 x 600 mm', thicknesses: ['36mm'], pricePerM2: 24.4, colors: ['-'], unidadPrecio: 'unidad' },
  { code: 'TFL-016', name: 'Top Floor Sobreelevado — Aluminio 36mm', tipo: 'Top Floor', terminacion: 'Aluminio', dimensions: '600 x 600 mm', thicknesses: ['36mm'], pricePerM2: 25.8, colors: ['-'], unidadPrecio: 'unidad' },
  { code: 'TFL-017', name: 'Pedestales Sobreelevado — 200 a 250mm', tipo: 'Top Floor', terminacion: '-', dimensions: '200 a 250 mm', thicknesses: ['-'], pricePerM2: 25.3, colors: [], unidadPrecio: 'unidad' },
  { code: 'TFL-018', name: 'Top Floor Lignum — Poro madera 7mm', tipo: 'Top Floor', terminacion: 'Poro madera', dimensions: '190 x 1200 mm', thicknesses: ['7mm'], pricePerM2: 10.6, colors: ['1045', '1047', '701', '703'] },

  // ─── TOP WALL ─────────────────────────────────────────────────────────────
  { code: 'TWL-001', name: 'Top Wall — Soft 9mm', tipo: 'Top Wall', terminacion: 'Soft', dimensions: '2750 x 285 mm', thicknesses: ['9mm'], pricePerM2: 20.4, colors: ['5005', '5008', '5011', '5019', '5049', '5053'] },
  { code: 'TWL-002', name: 'Top Wall Varillado — Soft 15mm', tipo: 'Top Wall', terminacion: 'Soft', dimensions: '2740 x 175 mm', thicknesses: ['15mm'], pricePerM2: 29, colors: ['Aliguieri', 'Nogal', 'Watambu'] },

  // ─── TOP KIT / SOLID / TABLE ──────────────────────────────────────────────
  { code: 'TKT-001', name: 'Top Kit MP — Mesada Laminada 25mm', tipo: 'Top Kit', terminacion: 'Brillante - Textura', dimensions: '3000 x 620 mm', thicknesses: ['25mm'], pricePerM2: 195.3, precioGrupoI: 195.3, precioGrupoII: 204.8, colors: ['Planos', 'Granitos', 'Maderas'] },
  { code: 'TKT-002', name: 'Top Kit MP — Mesada Laminada 30mm', tipo: 'Top Kit', terminacion: 'Brillante - Textura', dimensions: '3000 x 620 mm', thicknesses: ['30mm'], pricePerM2: 195.3, precioGrupoI: 195.3, precioGrupoII: 204.8, colors: ['Planos', 'Granitos', 'Maderas'] },
  { code: 'TKT-003', name: 'Top Kit HP — Mesada Laminada 25mm', tipo: 'Top Kit', terminacion: 'Brillante - Textura', dimensions: '3000 x 620 mm', thicknesses: ['25mm'], pricePerM2: 195.3, precioGrupoI: 195.3, precioGrupoII: 204.8, colors: ['Planos', 'Granitos', 'Maderas'] },
  { code: 'TKT-004', name: 'Top Kit XP — Mesada Laminada 13mm', tipo: 'Top Kit', terminacion: 'Brillante - Textura', dimensions: '3000 x 600 mm', thicknesses: ['13mm'], pricePerM2: 195.3, precioGrupoI: 195.3, precioGrupoII: 204.8, colors: ['Planos', 'Granitos', 'Maderas'] },
  { code: 'TKT-005', name: 'Top Solid — Mesada Kompak Concreto 5011 12mm', tipo: 'Top Solid', terminacion: 'Todas', dimensions: '3040 x 600 mm', thicknesses: ['12mm'], pricePerM2: 666.8, precioGrupoI: 666.8, precioGrupoII: 556.5, colors: ['Concreto 5011'], comentario: 'Con zócalo 45x3040 y frente sobreespesor 30mm' },
  { code: 'TKT-006', name: 'Top Solid — Mesada Kompak Blanco/Bruma 12mm', tipo: 'Top Solid', terminacion: 'Todas', dimensions: '3040 x 600 mm', thicknesses: ['12mm'], pricePerM2: 590.1, precioGrupoI: 590.1, precioGrupoII: 492.5, colors: ['Blanco 5171', 'Bruma 5171'], comentario: 'Con zócalo 45x3040 y frente sobreespesor 30mm' },
  { code: 'TKT-007', name: 'Top Table — Mesada Posformada 1200mm', tipo: 'Top Table', terminacion: 'Semi mate', dimensions: '82 x 1200 mm', thicknesses: ['30mm'], pricePerM2: 68.2, colors: ['5094', '5027', '5006', '5089', '5005', '5161', '5011', '5100', '5120'] },
  { code: 'TKT-008', name: 'Top Table — Mesada Posformada 1500mm', tipo: 'Top Table', terminacion: 'Semi mate', dimensions: '82 x 1500 mm', thicknesses: ['30mm'], pricePerM2: 84, colors: ['5094', '5027', '5006', '5089', '5005', '5161', '5011', '5100', '5120'] },
  { code: 'TKT-009', name: 'Top Table — Mesada Posformada 1800mm', tipo: 'Top Table', terminacion: 'Semi mate', dimensions: '82 x 1800 mm', thicknesses: ['30mm'], pricePerM2: 98.7, colors: ['5094', '5027', '5006', '5089', '5005', '5161', '5011', '5100', '5120'] },

  // ─── COVERWALL ────────────────────────────────────────────────────────────
  { code: 'CVW-001', name: 'Coverwall — 6mm (5529/5520/5534)', tipo: 'Coverwall', terminacion: '-', dimensions: '1000 x 128 mm', thicknesses: ['6mm'], pricePerM2: 80.9, colors: ['5529 Platino', '5520', '5534 Almendra'] },
  { code: 'CVW-002', name: 'Coverwall — 6mm (5525/5011/5053)', tipo: 'Coverwall', terminacion: '-', dimensions: '1000 x 128 mm', thicknesses: ['6mm'], pricePerM2: 101.9, colors: ['5525', '5011', '5053'] },
  { code: 'CVW-003', name: 'Herrajes Coverwall — caja x100', tipo: 'Coverwall', terminacion: '-', dimensions: '-', thicknesses: ['-'], pricePerM2: 21.4, colors: [], unidadPrecio: 'caja x100' },

  // ─── TOP BOX ──────────────────────────────────────────────────────────────
  { code: 'TBX-001', name: 'Top Box Baños XP — 1 Muro 9mm', tipo: 'Top Box', terminacion: '1 muro', dimensions: '1800 x 1200 mm', thicknesses: ['9mm'], pricePerM2: 729.8, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-002', name: 'Top Box Baños XP — 2 Muros 9mm', tipo: 'Top Box', terminacion: '2 muros', dimensions: '1800 x 1200 mm', thicknesses: ['9mm'], pricePerM2: 629, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-003', name: 'Top Box Baños XP — 3 Muros 9mm', tipo: 'Top Box', terminacion: '3 muros', dimensions: '1800 x 1200 mm', thicknesses: ['9mm'], pricePerM2: 529.2, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-004', name: 'Top Box Baños HP Piso — 1 Muro 13mm', tipo: 'Top Box', terminacion: '1 muro', dimensions: '2100 x 1200 mm', thicknesses: ['13mm'], pricePerM2: 865.2, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-005', name: 'Top Box Baños HP Piso — 2 Muros 13mm', tipo: 'Top Box', terminacion: '2 muros', dimensions: '2100 x 1200 mm', thicknesses: ['13mm'], pricePerM2: 735, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-006', name: 'Top Box Baños HP Piso — 3 Muros 13mm', tipo: 'Top Box', terminacion: '3 muros', dimensions: '2100 x 1200 mm', thicknesses: ['13mm'], pricePerM2: 605.9, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-007', name: 'Top Box Baños HP Piso — 1 Muro 15mm', tipo: 'Top Box', terminacion: '1 muro', dimensions: '2100 x 1200 mm', thicknesses: ['15mm'], pricePerM2: 963.9, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-008', name: 'Top Box Baños HP Piso — 2 Muros 15mm', tipo: 'Top Box', terminacion: '2 muros', dimensions: '2100 x 1200 mm', thicknesses: ['15mm'], pricePerM2: 818, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-009', name: 'Top Box Baños HP Piso — 3 Muros 15mm', tipo: 'Top Box', terminacion: '3 muros', dimensions: '2100 x 1200 mm', thicknesses: ['15mm'], pricePerM2: 672, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-010', name: 'Top Box Baños HP Suspendido — 1 Muro 9mm', tipo: 'Top Box', terminacion: '1 muro', dimensions: '2400 x 1200 mm', thicknesses: ['9mm'], pricePerM2: 958.7, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-011', name: 'Top Box Divisor Mingitorio — 10mm', tipo: 'Top Box', terminacion: '-', dimensions: '1000 x 450 mm', thicknesses: ['10mm'], pricePerM2: 106.1, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-012', name: 'Top Box Divisor Mingitorio — 13mm', tipo: 'Top Box', terminacion: '-', dimensions: '1000 x 450 mm', thicknesses: ['13mm'], pricePerM2: 114.5, colors: [], unidadPrecio: 'kit' },
  { code: 'TBX-013', name: 'Top Box Divisor Mingitorio — 15mm', tipo: 'Top Box', terminacion: '-', dimensions: '1000 x 450 mm', thicknesses: ['15mm'], pricePerM2: 122.9, colors: [], unidadPrecio: 'kit' },

  // ─── EXPOSITOR / TOP RACK ─────────────────────────────────────────────────
  { code: 'EXP-001', name: 'Panel Expositor MDF — Soft 5520 18mm', tipo: 'Panel Expositor', terminacion: 'Soft', dimensions: '1850 x 2750 mm', thicknesses: ['18mm'], pricePerM2: 68.3, colors: ['5520'], comentario: 'Precio por pallet de 40 tableros' },
  { code: 'EXP-002', name: 'Top Rack Panel Ranurado MDF — 5520 2mm', tipo: 'Top Rack', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 79.8, precioGrupoI: 79.8, precioGrupoII: 86.1, colors: ['5520'] },
  { code: 'EXP-003', name: 'Top Rack Panel Ranurado MDF — 5500 2mm', tipo: 'Top Rack', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 79.8, precioGrupoI: 79.8, precioGrupoII: 86.1, colors: ['5500 Negro'] },
  { code: 'EXP-004', name: 'Top Rack Panel Ranurado MDF — 5005 2mm', tipo: 'Top Rack', terminacion: '-', dimensions: '1220 x 3060 mm', thicknesses: ['2mm'], pricePerM2: 79.8, precioGrupoI: 79.8, precioGrupoII: 86.1, colors: ['5005'] },

  // ─── KARYSTYLE ────────────────────────────────────────────────────────────
  { code: 'KST-001', name: 'Karistyle — Brillante 18mm (5505/5500)', tipo: 'Karystyle', terminacion: 'Brillante', dimensions: '1220 x 3060 mm', thicknesses: ['18mm'], pricePerM2: 454.7, precioGrupoI: 454.7, precioGrupoII: 401.1, colors: ['5505 Blanco', '5500 Negro'], comentario: 'Otros colores consultar' },
  { code: 'KST-002', name: 'Karistyle Cantos — Brillante 1.5mm (lineal)', tipo: 'Karystyle', terminacion: 'Brillante', dimensions: '23 x 3060 mm', thicknesses: ['1.5mm'], pricePerM2: 1.1, colors: ['5505 Blanco', '5500 Negro'], unidadPrecio: 'ml', comentario: 'Precio por metro lineal' },

  // ─── KARIFORM POSFORMADO ─────────────────────────────────────────────────
  { code: 'KRF-001', name: 'Kariform P — Brillante/Textura 15mm', tipo: 'Kariform', terminacion: 'Brillante - Textura', dimensions: 'hasta 1000 x 3040 mm', thicknesses: ['15mm'], pricePerM2: 66.2, colors: ['Todos'] },
  { code: 'KRF-002', name: 'Kariform P — Brillante/Textura 18mm', tipo: 'Kariform', terminacion: 'Brillante - Textura', dimensions: 'hasta 1000 x 3040 mm', thicknesses: ['18mm'], pricePerM2: 68.3, colors: ['Todos'] },
  { code: 'KRF-003', name: 'Kariform P — Brillante/Textura 24mm', tipo: 'Kariform', terminacion: 'Brillante - Textura', dimensions: 'hasta 1000 x 3040 mm', thicknesses: ['24mm'], pricePerM2: 71.4, colors: ['Todos'] },
  { code: 'KRF-004', name: 'Kariform P — Brillante/Textura 30mm', tipo: 'Kariform', terminacion: 'Brillante - Textura', dimensions: 'hasta 1000 x 3040 mm', thicknesses: ['30mm'], pricePerM2: 73.5, colors: ['Todos'] },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI no encontrada en .env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Conectado a MongoDB')

  let inserted = 0, skipped = 0, errors = 0

  for (const p of products) {
    try {
      const result = await Product.findOneAndUpdate(
        { code: p.code },
        { $setOnInsert: { ...p, stock: 0 } },
        { upsert: true, new: false }
      )
      if (result === null) {
        inserted++
        process.stdout.write(`  + ${p.code} — ${p.name}\n`)
      } else {
        skipped++
        process.stdout.write(`  = ${p.code} ya existe\n`)
      }
    } catch (err) {
      errors++
      console.error(`  x ${p.code}: ${err.message}`)
    }
  }

  console.log(`\nSeed completado: ${inserted} insertados, ${skipped} existentes, ${errors} errores`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
