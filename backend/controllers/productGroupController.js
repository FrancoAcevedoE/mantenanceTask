import ProductGroup from '../models/productGroupModel.js'

export const getGroups = async (req, res) => {
  try {
    const groups = await ProductGroup.find().sort({ nombre: 1 })
    res.json(groups)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getGroupByNombre = async (req, res) => {
  try {
    const group = await ProductGroup.findOne({ nombre: req.params.nombre })
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' })
    res.json(group)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
