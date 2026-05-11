const LearningMaterial = require('../models/LearningMaterial');

// POST /api/materials
const createMaterial = async (req, res) => {
  try {
    const { subject, topic, content } = req.body;
    const material = new LearningMaterial({ subject, topic, content });
    const saved = await material.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/materials
const getMaterials = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject ? { subject } : {};
    const materials = await LearningMaterial.find(filter).sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/materials/:id
const getMaterialById = async (req, res) => {
  try {
    const material = await LearningMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createMaterial, getMaterials, getMaterialById };
