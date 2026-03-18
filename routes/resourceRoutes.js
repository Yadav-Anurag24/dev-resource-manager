const express = require('express');
const router = express.Router();
const {
  getAllResources,
  createResource,
  getResourceById,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const validateResource = require('../middlewares/validateResource');
const uploadResourceFile = require('../middlewares/uploadResourceFile');

// GET    /api/resources       → list all resources (filtering & search)
router.get('/', getAllResources);

// POST   /api/resources       → create a new resource
router.post('/', uploadResourceFile.single('resourceFile'), validateResource, createResource);

// GET    /api/resources/:id   → get a single resource
router.get('/:id', getResourceById);

// PUT    /api/resources/:id   → update a resource
router.put('/:id', uploadResourceFile.single('resourceFile'), validateResource, updateResource);

// DELETE /api/resources/:id   → delete a resource
router.delete('/:id', deleteResource);

module.exports = router;
