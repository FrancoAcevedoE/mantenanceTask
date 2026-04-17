import mongoose from "mongoose"
import dotenv from "dotenv"
import Maintenance from "../models/mantenanceModels.js"

dotenv.config()

const validateMigration = async () => {
    try {
        console.log("🔍 Iniciando validación de compatibilidad de datos...")
        
        const mongoUri = process.env.MONGODB_URI
        if (!mongoUri) {
            throw new Error("MONGODB_URI no configurado en .env")
        }

        await mongoose.connect(mongoUri)
        console.log("✅ Conectado a MongoDB\n")

        const allDocs = await Maintenance.find().lean()
        const issues = []
        let validCount = 0

        console.log(`📊 Validando ${allDocs.length} documentos...\n`)

        for (const [index, doc] of allDocs.entries()) {
            const docIssues = []

            // Verificar machinePart
            if (doc.machinePart === undefined) {
                docIssues.push("⚠️  machinePart es undefined")
            } else if (doc.machinePart === null) {
                docIssues.push("⚠️  machinePart es null (debería ser array)")
            } else if (!Array.isArray(doc.machinePart)) {
                docIssues.push(`❌ machinePart no es array: tipo=${typeof doc.machinePart}, valor="${doc.machinePart}"`)
            } else if (doc.machinePart.length === 0) {
                docIssues.push("⚠️  machinePart es array vacío")
            } else if (!doc.machinePart.every(p => typeof p === 'string')) {
                docIssues.push(`❌ machinePart contiene elementos no-string: ${JSON.stringify(doc.machinePart)}`)
            } else {
                validCount++
            }

            // Verificar que otros campos necesarios existan
            if (!doc.machine) docIssues.push("❌ machine no existe")
            if (!doc.sector) docIssues.push("❌ sector no existe")
            if (doc.hoursWorked === undefined) docIssues.push("❌ hoursWorked no existe")
            if (doc.clientId === undefined) docIssues.push("❌ clientId no existe")

            if (docIssues.length > 0) {
                issues.push({
                    id: doc._id,
                    machine: doc.machine,
                    machinePart: doc.machinePart,
                    issues: docIssues
                })
            }

            // Progress indicator
            if ((index + 1) % 50 === 0) {
                console.log(`  [${index + 1}/${allDocs.length}] documentos procesados...`)
            }
        }

        console.log(`\n📈 Resultados de validación:`)
        console.log(`   ✅ Documentos válidos: ${validCount}/${allDocs.length}`)
        console.log(`   ❌ Documentos con problemas: ${issues.length}/${allDocs.length}`)

        if (issues.length > 0) {
            console.log(`\n🚨 Problemas encontrados:\n`)
            issues.slice(0, 10).forEach((issue, i) => {
                console.log(`   ${i + 1}. ID: ${issue.id}`)
                console.log(`      Máquina: ${issue.machine}`)
                console.log(`      machinePart: ${JSON.stringify(issue.machinePart)}`)
                issue.issues.forEach(p => console.log(`      ${p}`))
                console.log()
            })

            if (issues.length > 10) {
                console.log(`   ... y ${issues.length - 10} problemas más`)
            }

            console.log(`\n⚠️  Se recomienda ejecutar la migración antes de usar la aplicación en producción.`)
        } else {
            console.log(`\n✅ ¡Todos los documentos son válidos! La estructura es compatible.`)
        }

        // Estadísticas de tipos
        const stringCount = allDocs.filter(d => typeof d.machinePart === 'string').length
        const arrayCount = allDocs.filter(d => Array.isArray(d.machinePart)).length
        const nullCount = allDocs.filter(d => d.machinePart === null || d.machinePart === undefined).length

        console.log(`\n📊 Distribución de tipos:`)
        console.log(`   String: ${stringCount}`)
        console.log(`   Array: ${arrayCount}`)
        console.log(`   Null/Undefined: ${nullCount}`)

        if (stringCount > 0) {
            console.log(`\n💡 Ejecuta: node scripts/migrateMachinePartToArray.js`)
        }

        await mongoose.disconnect()
        console.log("\n✅ Desconectado de MongoDB")
        process.exit(issues.length > 0 && validCount < allDocs.length ? 1 : 0)

    } catch (error) {
        console.error("❌ Error durante la validación:", error.message)
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect()
        }
        process.exit(1)
    }
}

validateMigration()
