import Product from "../models/productModel.js"
import AuditLog from "../models/auditLogModel.js"
import { registerAuditEvent } from "../services/auditService.js"

function calcM2(medida) {
    if (!medida) return null
    const parts = medida.replace(/mm/gi, '').split(/[x×]/i).map(s => parseFloat(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return Number(((parts[0] * parts[1]) / 1000000).toFixed(4))
    }
    return null
}

export const createProductController = async (req, res) => {
    try {
        const body = req.body
        const code = body.code || `${body.prefijo || ''}${body.color || ''}${body.terminacion || ''}${body.nomenclaturaMedida || ''}`
        const m2 = calcM2(body.medida)

        const product = new Product({
            name: body.name,
            code,
            prefijo: body.prefijo,
            tipo: body.tipo,
            espesor: body.espesor,
            detalle: body.detalle,
            terminacion: body.terminacion,
            color: body.color,
            medida: body.medida,
            dimensions: body.medida,
            nomenclaturaMedida: body.nomenclaturaMedida,
            m2,
            grupo: body.grupo,
            image: body.image,
            precio: body.precio,
            unidadPrecio: body.unidadPrecio,
            admiteDescuentos: body.admiteDescuentos ?? true,
            comentario: body.comentario,
            colors: body.color ? [body.color] : [],
            thicknesses: body.espesor ? [body.espesor] : [],
            precioGrupoI: body.precio,
        })

        await product.save()

        await registerAuditEvent({
            req,
            action: "CREATE_PRODUCT",
            entityType: "Product",
            entityId: product._id,
            description: `Producto creado: ${product.name} (${code})`,
            metadata: { code, name: product.name, grupo: product.grupo, precio: product.precio }
        })

        res.status(201).json({ message: "Product created successfully", product })
    } catch (error) {
        console.error("Error creating product:", error)
        if (error.code === 11000) {
            return res.status(400).json({ message: "Ya existe un producto con ese SKU" })
        }
        res.status(500).json({ message: "Error creating product", error: error.message })
    }
}

export const getProductsController = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 })
        res.json(products)
    } catch (error) {
        console.error("Error fetching products:", error)
        res.status(500).json({ message: "Error fetching products", error: error.message })
    }
}

export const updateProductController = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body

        if (updates.medida) {
            updates.m2 = calcM2(updates.medida)
            updates.dimensions = updates.medida
        }
        if (updates.color) updates.colors = [updates.color]
        if (updates.espesor) updates.thicknesses = [updates.espesor]
        if (updates.precio != null) updates.precioGrupoI = updates.precio

        const product = await Product.findByIdAndUpdate(id, updates, { returnDocument: 'after' })

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        await registerAuditEvent({
            req,
            action: "UPDATE_PRODUCT",
            entityType: "Product",
            entityId: product._id,
            description: `Producto actualizado: ${product.name}`,
        })

        res.json({ message: "Product updated successfully", product })
    } catch (error) {
        console.error("Error updating product:", error)
        res.status(500).json({ message: "Error updating product", error: error.message })
    }
}

export const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params

        const product = await Product.findByIdAndDelete(id)

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        await registerAuditEvent({
            req,
            action: "DELETE_PRODUCT",
            entityType: "Product",
            entityId: product._id,
            description: `Producto eliminado: ${product.name} (${product.code})`,
            metadata: { code: product.code, name: product.name, grupo: product.grupo }
        })

        res.json({ message: "Product deleted successfully" })
    } catch (error) {
        console.error("Error deleting product:", error)
        res.status(500).json({ message: "Error deleting product", error: error.message })
    }
}

export const deleteAllProductsController = async (req, res) => {
    try {
        const count = await Product.countDocuments()
        await Product.deleteMany({})

        await registerAuditEvent({
            req,
            action: "DELETE_ALL_PRODUCTS",
            entityType: "Product",
            entityId: "",
            description: `Se vaciaron todos los productos (${count} eliminados)`,
            metadata: { count }
        })

        res.json({ message: `${count} productos eliminados` })
    } catch (error) {
        console.error("Error deleting all products:", error)
        res.status(500).json({ message: "Error deleting products", error: error.message })
    }
}

export const getProductAuditLogController = async (req, res) => {
    try {
        const logs = await AuditLog.find({
            entityType: "Product"
        }).sort({ createdAt: -1 }).limit(200).lean()

        res.json(logs)
    } catch (error) {
        console.error("Error fetching product audit logs:", error)
        res.status(500).json({ message: "Error fetching audit logs", error: error.message })
    }
}
