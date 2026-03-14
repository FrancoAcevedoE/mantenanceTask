import User from "../models/userModels.js"
import jwt from "jsonwebtoken"

export const login = async (req, res) => {

    const { dni, password } = req.body

    const user = await User.findOne({
        dni,
        password
    })

    if (!user) {
        return res.status(401).json({
            message: "Credenciales invalidas"
        })
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        "secretkey",
        { expiresIn: "1h" }
    )

    res.json({ token })
}
