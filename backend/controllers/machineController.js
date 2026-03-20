import Machine from "../models/machineModels.js"

export const newMachineController = async (req, res) => {
  try {
    const { sector, name, machineParts, horometro, instructions } = req.body

    const machine = new Machine({
      sector,
      name,
      machineParts,
      horometro: horometro || 0,
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

    const machine = await Machine.findByIdAndUpdate(
      id,
      { sector, name, machineParts, horometro, instructions },
      { new: true }
    )

    if (!machine) {
      return res.status(404).json({ error: "Máquina no encontrada" })
    }

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
