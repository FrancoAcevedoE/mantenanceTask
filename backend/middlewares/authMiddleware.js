import jwt from "jsonwebtoken"

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está definido. Configurá la variable de entorno.")
  }
  console.warn("[auth] ADVERTENCIA: JWT_SECRET no definido, usando fallback de desarrollo.")
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-prod"

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
    } catch {
        return res.status(401).json({ message: "Token invalido o expirado" })
    }
}

export { JWT_SECRET }

