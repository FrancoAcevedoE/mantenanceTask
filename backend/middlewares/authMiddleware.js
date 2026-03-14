module.exports = (req, res, next) => {
    const jwt = require("jsonwebtoken")

    exports.verifyAdmin = (req, res, next) => {

        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(403).json({
                message: "Token no proporcionado"
            })
        }

        try {
            const decoded = jwt.verify(token, "secretkey")
            req.user = decoded

            next()

        } catch (error) {
            return res.status(401).json({
                message: "Token invalido"
            })
        }
    }
}

