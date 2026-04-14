const express = require('express');
const router = express.Router();
const {
  getAllResources,
  createResource,
  getResourceById,
  updateResource,
  deleteResource,
  getResourceStats,
  toggleBookmark,
  getBookmarks,
  exportResources,
} = require('../controllers/resourceController');
const { protect, admin } = require('../middlewares/authMiddleware');
const validateResource = require('../middlewares/validateResource');
const uploadResourceFile = require('../middlewares/uploadResourceFile');

// GET    /api/resources/stats → dashboard analytics (must be before /:id)
router.get('/stats', getResourceStats);

// GET    /api/resources/bookmarks → get user's bookmarked resources (must be before /:id)
router.get('/bookmarks', protect, getBookmarks);

// GET    /api/resources/export → export resources as CSV or JSON (must be before /:id)
router.get('/export', protect, exportResources);

// GET    /api/resources       → list all resources (filtering, search, pagination)
router.get('/', getAllResources);

// POST   /api/resources       → create a new resource
router.post('/', protect, uploadResourceFile.single('resourceFile'), validateResource, createResource);

// POST   /api/resources/:id/bookmark → toggle bookmark on a resource
router.post('/:id/bookmark', protect, toggleBookmark);

// GET    /api/resources/:id   → get a single resource
router.get('/:id', getResourceById);

// PUT    /api/resources/:id   → update a resource
router.put('/:id', protect, uploadResourceFile.single('resourceFile'), validateResource, updateResource);

// DELETE /api/resources/:id   → delete a resource (owner or admin)
router.delete('/:id', protect, deleteResource);

module.exports = router;
