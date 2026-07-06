/**
 * Crea o restaura el usuario de prueba con DNI 00000000 / contraseña 0000 / rol admin.
 * Correr una sola vez: node scripts/createTestUser.js
 */
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import 'dotenv/config'
import User from '../models/userModels.js'

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mantenanceDB'

await mongoose.connect(MONGO_URI)
console.log('Conectado a MongoDB:', MONGO_URI)

const TEST_DNI  = 0        // Number("00000000") = 0
const TEST_PASS = '0000'
const hashed    = await bcrypt.hash(TEST_PASS, 10)

// Buscar incluyendo eliminados
const existing = await User.findOne({ dni: TEST_DNI })

if (existing) {
  // Restaurar y actualizar por si estaba eliminado o tenía otro rol
  existing.role      = 'admin'
  existing.password  = hashed
  existing.isDeleted = false
  existing.deletedAt = null
  existing.name      = existing.name || 'Test'
  await existing.save()
  console.log(`✓ Usuario de prueba actualizado (id: ${existing._id})`)
} else {
  const u = await User.create({
    name:      'Test',
    dni:       TEST_DNI,
    password:  hashed,
    role:      'admin',
    isDeleted: false,
  })
  console.log(`✓ Usuario de prueba creado (id: ${u._id})`)
}

console.log('  DNI:        00000000')
console.log('  Contraseña: 0000')
console.log('  Rol:        admin')

await mongoose.disconnect()
