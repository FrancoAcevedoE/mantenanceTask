import Quote from "../models/quoteModel.js"
import Product from "../models/productModel.js"
import { registerAuditEvent } from "../services/auditService.js"

export const createQuoteController = async (req, res) => {
    try {
        const { productId, quantityM2 } = req.body
        const sellerId = req.user._id

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        const totalPriceWithoutDiscount = product.pricePerM2 * quantityM2

        // Calculate discount based on quantity
        let discountPercent = 0
        for (const disc of product.discounts.sort((a, b) => b.quantity - a.quantity)) {
            if (quantityM2 >= disc.quantity) {
                discountPercent = disc.discountPercent
                break
            }
        }

        const totalPriceWithDiscount = totalPriceWithoutDiscount * (1 - discountPercent / 100)

        const quote = new Quote({
            sellerId,
            productId,
            quantityM2,
            totalPriceWithoutDiscount,
            totalPriceWithDiscount,
            discountApplied: discountPercent
        })

        await quote.save()

        await registerAuditEvent({
            action: "CREATE_QUOTE",
            entity: "Quote",
            entityId: quote._id,
            details: `Quote for ${product.name} created by ${req.user.name}`,
            performedBy: req.user.name
        })

        res.status(201).json({ message: "Quote created successfully", quote })
    } catch (error) {
        console.error("Error creating quote:", error)
        res.status(500).json({ message: "Error creating quote", error: error.message })
    }
}

export const getQuotesController = async (req, res) => {
    try {
        const sellerId = req.user._id

        const quotes = await Quote.find({ sellerId }).populate('productId').sort({ createdAt: -1 })
        res.json(quotes)
    } catch (error) {
        console.error("Error fetching quotes:", error)
        res.status(500).json({ message: "Error fetching quotes", error: error.message })
    }
}