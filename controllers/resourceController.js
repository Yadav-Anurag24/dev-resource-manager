const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const Resource = require('../models/Resource');

function isInvalidResourceId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

async function safelyDeleteStoredFile(filePath) {
  if (!filePath) return;

  const absolutePath = path.join(process.cwd(), filePath.replace(/^[/\\]/, ''));

  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    // Ignore file-system cleanup errors to avoid breaking API responses.
  }
}

/**
 * @desc    List all resources with optional filtering and search
 * @route   GET /api/resources
 */
const getAllResources = async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;
    const filter = {};

    if (category && category !== '') {
      filter.category = category;
    }

    if (difficulty && difficulty !== '') {
      filter.difficulty = difficulty;
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
      ];
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new resource
 * @route   POST /api/resources
 */
const createResource = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, link, tags, rating } = req.body;
    const trimmedLink = typeof link === 'string' ? link.trim() : '';

    // Process tags: split comma-separated string into array
    const processedTags = tags
      ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    const resource = new Resource({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      link: trimmedLink,
      fileName: req.file ? req.file.originalname : '',
      filePath: req.file ? `/uploads/${req.file.filename}` : '',
      fileMimeType: req.file ? req.file.mimetype : '',
      fileSize: req.file ? req.file.size : 0,
      tags: processedTags,
      rating: rating ? Number(rating) : 0,
    });

    await resource.save();
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors });
    }
    next(err);
  }
};

/**
 * @desc    Get a single resource by ID
 * @route   GET /api/resources/:id
 */
const getResourceById = async (req, res, next) => {
  try {
    if (isInvalidResourceId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a resource
 * @route   PUT /api/resources/:id
 */
const updateResource = async (req, res, next) => {
  try {
    if (isInvalidResourceId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const { title, description, category, difficulty, link, tags, rating, existingFilePath } = req.body;
    const trimmedLink = typeof link === 'string' ? link.trim() : '';

    // Process tags
    const processedTags = tags
      ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    const existingResource = await Resource.findById(req.params.id);
    if (!existingResource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    const shouldKeepExistingFile =
      !req.file &&
      typeof existingFilePath === 'string' &&
      existingFilePath.trim() === existingResource.filePath;

    const updatedData = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      link: trimmedLink,
      tags: processedTags,
      rating: rating ? Number(rating) : 0,
      fileName: shouldKeepExistingFile ? existingResource.fileName : '',
      filePath: shouldKeepExistingFile ? existingResource.filePath : '',
      fileMimeType: shouldKeepExistingFile ? existingResource.fileMimeType : '',
      fileSize: shouldKeepExistingFile ? existingResource.fileSize : 0,
    };

    if (req.file) {
      updatedData.fileName = req.file.originalname;
      updatedData.filePath = `/uploads/${req.file.filename}`;
      updatedData.fileMimeType = req.file.mimetype;
      updatedData.fileSize = req.file.size;

      if (existingResource.filePath) {
        await safelyDeleteStoredFile(existingResource.filePath);
      }
    } else if (!shouldKeepExistingFile && existingResource.filePath) {
      await safelyDeleteStoredFile(existingResource.filePath);
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: resource });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors });
    }
    next(err);
  }
};

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:id
 */
const deleteResource = async (req, res, next) => {
  try {
    if (isInvalidResourceId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    if (resource.filePath) {
      await safelyDeleteStoredFile(resource.filePath);
    }

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllResources,
  createResource,
  getResourceById,
  updateResource,
  deleteResource,
};
