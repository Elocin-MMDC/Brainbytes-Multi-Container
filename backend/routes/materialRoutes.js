const express = require('express');
const router = express.Router();
const { createMaterial, getMaterials, getMaterialById } = require('../controllers/materialController');

router.post('/materials', createMaterial);
router.get('/materials', getMaterials);
router.get('/materials/:id', getMaterialById);

module.exports = router;
