import User from "../models/userModels.js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

export const login = async (req, res) => {

    try {

        const dniRaw = String(req.body.dni ?? "").trim()
        const passwordRaw = String(req.body.password ?? "").trim()

        if (!/^\d{8}$/.test(dniRaw)) {
            return res.status(400).json({
                message: "El usuario debe ser un DNI de 8 digitos numericos"
            })
        }

        if (!/^\d{4}$/.test(passwordRaw)) {
            return res.status(400).json({
                message: "La contrasena debe tener 4 digitos numericos"
            })
        }

        const dniNumber = Number(dniRaw)
        const passwordNumber = Number(passwordRaw)

        const user = await User.findOne({
            dni: dniNumber,
            password: passwordNumber
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
            JWT_SECRET,
            { expiresIn: "1h" }
        )

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                dni: user.dni,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al iniciar sesion",
            detail: error.message
        })
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("name dni role")
            .sort({ name: 1 })

        res.json(users)
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuarios"
        })
    }
}

export const getOperarios = async (req, res) => {
    try {
        const operarios = await User.find({ role: "operario" })
            .select("name dni role")
            .sort({ name: 1 })

        res.json(operarios)
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener operarios"
        })
    }
}

export const createUser = async (req, res) => {
    try {
        const { name, role } = req.body
        const dniRaw = String(req.body.dni ?? "").trim()
        const passwordRaw = String(req.body.password ?? "").trim()

        if (!name || !dniRaw || !passwordRaw) {
            return res.status(400).json({
                message: "Nombre, documento y contrasena son obligatorios"
            })
        }

        if (!/^\d{8}$/.test(dniRaw)) {
            return res.status(400).json({
                message: "El documento debe tener exactamente 8 digitos numericos"
            })
        }

        if (!/^\d{4}$/.test(passwordRaw)) {
            return res.status(400).json({
                message: "La contrasena debe tener exactamente 4 digitos numericos"
            })
        }

        const dni = Number(dniRaw)
        const password = Number(passwordRaw)

        const existingUser = await User.findOne({ dni })

        if (existingUser) {
            return res.status(409).json({
                message: "Ya existe un usuario con ese documento"
            })
        }

        const user = await User.create({
            name,
            dni,
            password,
            role: role || "operario"
        })

        res.status(201).json({
            message: "Usuario creado correctamente",
            user: {
                id: user._id,
                name: user.name,
                dni: user.dni,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al crear usuario"
        })
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                message: "No puedes eliminar tu propio usuario"
            })
        }

        const user = await User.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        res.json({
            message: "Usuario eliminado correctamente"
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar usuario"
        })
    }
}
