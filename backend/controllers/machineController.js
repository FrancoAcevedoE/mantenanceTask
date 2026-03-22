import Machine from "../models/machineModels.js"

const parseHorometro = (value) => {
  if (value === undefined || value === null || value === "") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return NaN
  return parsed
}

const normalizeSector = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()

const addHorometroHistoryIfChanged = (machine, nextHorometro) => {
  if (machine.horometro !== nextHorometro) {
    machine.horometroHistory.push({ value: nextHorometro, recordedAt: new Date() })
  }
}

export const newMachineController = async (req, res) => {
  try {
    const { sector, name, machineParts, horometro, instructions } = req.body
    const normalizedSector = normalizeSector(sector)

    if (!normalizedSector) {
      return res.status(400).json({ error: "El sector es obligatorio" })
    }

    const normalizedMachineParts = Array.isArray(machineParts)
      ? machineParts.map(part => String(part).trim()).filter(Boolean)
      : [String(machineParts || "").trim()].filter(Boolean)

    if (!normalizedMachineParts.length) {
      return res.status(400).json({ error: "Debes cargar al menos una parte de maquina" })
    }

    const normalizedHorometro = parseHorometro(horometro)
    if (Number.isNaN(normalizedHorometro)) {
      return res.status(400).json({ error: "El horómetro debe ser un número mayor o igual a 0" })
    }

    const initialHorometro = normalizedHorometro ?? 0

    const machine = new Machine({
      sector: normalizedSector,
      name,
      machineParts: normalizedMachineParts,
      horometro: initialHorometro,
      horometroHistory: [{ value: initialHorometro, recordedAt: new Date() }],
      instructions: instructions || ""
    })

    await machine.save()
    res.status(201).json({ message: "Máquina creada correctamente", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAllMachinesController = async (req, res) => {
  try {
    const machines = await Machine.find()
    res.status(200).json(machines)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getMachineByIdController = async (req, res) => {
  try {
    const { id } = req.params
    const machine = await Machine.findById(id)
    
    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }
    
    res.status(200).json(machine)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateMachineController = async (req, res) => {
  try {
    const { id } = req.params
    const { sector, name, machineParts, horometro, instructions } = req.body
    const normalizedSector = normalizeSector(sector)

    if (!normalizedSector) {
      return res.status(400).json({ error: "El sector es obligatorio" })
    }

    const normalizedMachineParts = Array.isArray(machineParts)
      ? machineParts.map(part => String(part).trim()).filter(Boolean)
      : [String(machineParts || "").trim()].filter(Boolean)

    if (!normalizedMachineParts.length) {
      return res.status(400).json({ error: "Debes cargar al menos una parte de maquina" })
    }

    const normalizedHorometro = parseHorometro(horometro)
    if (Number.isNaN(normalizedHorometro)) {
      return res.status(400).json({ error: "El horómetro debe ser un número mayor o igual a 0" })
    }

    const machine = await Machine.findById(id)

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    machine.sector = normalizedSector
    machine.name = name
    machine.machineParts = normalizedMachineParts
    machine.instructions = instructions

    if (normalizedHorometro !== null) {
      addHorometroHistoryIfChanged(machine, normalizedHorometro)
      machine.horometro = normalizedHorometro
    }

    await machine.save()

    res.status(200).json({ message: "Máquina actualizada", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const updateHorometroController = async (req, res) => {
  try {
    const { id } = req.params
    const { horometro } = req.body

    const normalizedHorometro = parseHorometro(horometro)
    if (Number.isNaN(normalizedHorometro) || normalizedHorometro === null) {
      return res.status(400).json({ error: "El horómetro debe ser un número mayor o igual a 0" })
    }

    const machine = await Machine.findById(id)

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    addHorometroHistoryIfChanged(machine, normalizedHorometro)
    machine.horometro = normalizedHorometro
    await machine.save()

    res.status(200).json({ message: "Horómetro actualizado", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const updateInstructionsController = async (req, res) => {
  try {
    const { id } = req.params
    const { instructions } = req.body

    const machine = await Machine.findByIdAndUpdate(
      id,
      { instructions },
      { new: true }
    )

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    res.status(200).json({ message: "Instrucciones actualizadas", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const updateMachinePartsController = async (req, res) => {
  try {
    const { id } = req.params
    const { machineParts } = req.body

    const normalizedMachineParts = Array.isArray(machineParts)
      ? machineParts.map(part => String(part).trim()).filter(Boolean)
      : [String(machineParts || "").trim()].filter(Boolean)

    if (!normalizedMachineParts.length) {
      return res.status(400).json({ error: "Debes cargar al menos una parte de maquina" })
    }

    const machine = await Machine.findByIdAndUpdate(
      id,
      { machineParts: normalizedMachineParts },
      { new: true }
    )

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    res.status(200).json({ message: "Partes de máquina actualizadas", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const updateSectorController = async (req, res) => {
  try {
    const { id } = req.params
    const { sector } = req.body
    const normalizedSector = normalizeSector(sector)

    if (!normalizedSector) {
      return res.status(400).json({ error: "El sector es obligatorio" })
    }

    const machine = await Machine.findByIdAndUpdate(
      id,
      { sector: normalizedSector },
      { new: true }
    )

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    res.status(200).json({ message: "Sector actualizado", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const updateNameController = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const machine = await Machine.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    res.status(200).json({ message: "Nombre actualizado", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const modifyMachineController = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    if (updates.machineParts) {
      updates.machineParts = Array.isArray(updates.machineParts)
        ? updates.machineParts.map(part => String(part).trim()).filter(Boolean)
        : [String(updates.machineParts || "").trim()].filter(Boolean)

      if (!updates.machineParts.length) {
        return res.status(400).json({ error: "Debes cargar al menos una parte de maquina" })
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "horometro")) {
      const normalizedHorometro = parseHorometro(updates.horometro)
      if (Number.isNaN(normalizedHorometro) || normalizedHorometro === null) {
        return res.status(400).json({ error: "El horómetro debe ser un número mayor o igual a 0" })
      }
      updates.horometro = normalizedHorometro
    }

    const machine = await Machine.findById(id)

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    if (Object.prototype.hasOwnProperty.call(updates, "sector")) {
      const normalizedSector = normalizeSector(updates.sector)

      if (!normalizedSector) {
        return res.status(400).json({ error: "El sector es obligatorio" })
      }

      machine.sector = normalizedSector
    }

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      machine.name = updates.name
    }

    if (Object.prototype.hasOwnProperty.call(updates, "instructions")) {
      machine.instructions = updates.instructions
    }

    if (Object.prototype.hasOwnProperty.call(updates, "machineParts")) {
      machine.machineParts = updates.machineParts
    }

    if (Object.prototype.hasOwnProperty.call(updates, "horometro")) {
      addHorometroHistoryIfChanged(machine, updates.horometro)
      machine.horometro = updates.horometro
    }

    await machine.save()

    res.status(200).json({ message: "Máquina actualizada", machine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteMachineController = async (req, res) => {
  try {
    const { id } = req.params
    const machine = await Machine.findByIdAndDelete(id)

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

    res.status(200).json({ message: "Máquina eliminada" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
