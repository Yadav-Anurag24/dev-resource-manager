const express = require('express');
const router = express.Router();
const {
  getAllResources,
  renderAddForm,
  createResource,
  getResourceById,
  renderEditForm,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const validateResource = require('../middlewares/validateResource');

// GET /resources          → List all resources (with filtering & search)
router.get('/', getAllResources);

// GET /resources/new      → Render add resource form
router.get('/new', renderAddForm);

// POST /resources         → Create a new resource
router.post('/', validateResource, createResource);

// GET /resources/:id      → View resource details
router.get('/:id', getResourceById);

// GET /resources/:id/edit → Render edit resource form
router.get('/:id/edit', renderEditForm);

// PUT /resources/:id      → Update a resource
router.put('/:id', updateResource);

// DELETE /resources/:id   → Delete a resource
router.delete('/:id', deleteResource);

module.exports = router;
