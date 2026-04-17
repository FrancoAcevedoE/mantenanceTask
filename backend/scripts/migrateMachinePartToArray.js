import mongoose from "mongoose"
import dotenv from "dotenv"
import Maintenance from "../models/mantenanceModels.js"

dotenv.config()

const migrateMaintenanceData = async () => {
    try {
        console.log("🔄 Iniciando migración de machinePart a array...")
        
        const mongoUri = process.env.MONGODB_URI
        if (!mongoUri) {
            throw new Error("MONGODB_URI no configurado en .env")
        }

        await mongoose.connect(mongoUri)
        console.log("✅ Conectado a MongoDB")

        // Obtener estadísticas antes de la migración
        const totalDocs = await Maintenance.countDocuments()
        const strDocs = await Maintenance.countDocuments({ machinePart: { $type: "string" } })
        const arrayDocs = await Maintenance.countDocuments({ machinePart: { $type: "array" } })

        console.log(`\n📊 Estadísticas iniciales:`)
        console.log(`   Total de documentos: ${totalDocs}`)
        console.log(`   Con machinePart string: ${strDocs}`)
        console.log(`   Con machinePart array: ${arrayDocs}`)

        if (strDocs === 0) {
            console.log("\n✅ Ya todos los documentos tienen machinePart en formato array")
            await mongoose.disconnect()
            process.exit(0)
        }

        // Obtener acceso al cliente nativo
        const db = mongoose.connection.db

        // Hacer la migración usando aggregation pipeline
        const result = await db.collection("maintenances").updateMany(
            { machinePart: { $type: "string" } },
            [
                {
                    $set: {
                        machinePart: {
                            $cond: [
                                { $and: [{ $ne: ["$machinePart", ""] }, { $ne: ["$machinePart", null] }] },
                                ["$machinePart"],
                                []
                            ]
                        }
                    }
                }
            ]
        )

        console.log(`\n✅ Migración completada:`)
        console.log(`   Documentos modificados: ${result.modifiedCount}`)
        console.log(`   Documentos sin cambios: ${result.matchedCount - result.modifiedCount}`)

        // Pequeña pausa para asegurar que MongoDB sincronice
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verificar después de la migración
        const newStrDocs = await Maintenance.countDocuments({ machinePart: { $type: "string" } })
        const newArrayDocs = await Maintenance.countDocuments({ machinePart: { $type: "array" } })

        console.log(`\n📊 Estadísticas finales:`)
        console.log(`   Con machinePart string: ${newStrDocs}`)
        console.log(`   Con machinePart array: ${newArrayDocs}`)

        if (newStrDocs === 0 && newArrayDocs === totalDocs) {
            console.log("\n✅ ¡Migración exitosa! Todos los documentos tienen el formato correcto.")
        } else if (newStrDocs === 0) {
            console.log("\n✅ ¡Migración completada! Se han actualizado " + result.modifiedCount + " documentos.")
        } else {
            console.warn("\n⚠️  Algunos documentos aún tienen formato string. Verifica manualmente.")
        }

        await mongoose.disconnect()
        console.log("\n✅ Desconectado de MongoDB")
        process.exit(0)

    } catch (error) {
        console.error("❌ Error durante la migración:", error.message)
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect()
        }
        process.exit(1)
    }
}

migrateMaintenanceData()
