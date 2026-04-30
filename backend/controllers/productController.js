import Product from "../models/productModel.js"
import { registerAuditEvent } from "../services/auditService.js"

export const createProductController = async (req, res) => {
    try {
        const { name, code, colors, dimensions, thicknesses, pricePerM2, discounts, image } = req.body

        const product = new Product({
            name,
            code,
            colors,
            dimensions,
            thicknesses,
            pricePerM2,
            discounts,
            image
        })

        await product.save()

        await registerAuditEvent({
            action: "CREATE_PRODUCT",
            entity: "Product",
            entityId: product._id,
            details: `Product ${name} created`,
            performedBy: req.user?.name || "System"
        })

        res.status(201).json({ message: "Product created successfully", product })
    } catch (error) {
        console.error("Error creating product:", error)
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

        const product = await Product.findByIdAndUpdate(id, updates, { new: true })

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        await registerAuditEvent({
            action: "UPDATE_PRODUCT",
            entity: "Product",
            entityId: product._id,
            details: `Product ${product.name} updated`,
            performedBy: req.user?.name || "System"
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
            action: "DELETE_PRODUCT",
            entity: "Product",
            entityId: product._id,
            details: `Product ${product.name} deleted`,
            performedBy: req.user?.name || "System"
        })

        res.json({ message: "Product deleted successfully" })
    } catch (error) {
        console.error("Error deleting product:", error)
        res.status(500).json({ message: "Error deleting product", error: error.message })
    }
}