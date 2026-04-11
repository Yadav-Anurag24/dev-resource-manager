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
 * @desc    List all resources with optional filtering, search, pagination & sorting
 * @route   GET /api/resources
 */
const getAllResources = async (req, res, next) => {
  try {
    const { category, difficulty, search, page, limit, sortBy, sortOrder } = req.query;
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

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ['title', 'category', 'difficulty', 'rating', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [resources, totalResources] = await Promise.all([
      Resource.find(filter)
        .populate('owner', 'username role')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum),
      Resource.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalResources / limitNum);

    res.json({
      success: true,
      data: resources,
      currentPage: pageNum,
      totalPages,
      totalResources,
    });
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
      owner: req.user._id,
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
    await resource.populate('owner', 'username role');
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

    const resource = await Resource.findById(req.params.id)
      .populate('owner', 'username role');

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

    // Ownership check: only owner or admin can update
    const isOwner = existingResource.owner && existingResource.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this resource' });
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
    ).populate('owner', 'username role');

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

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    // Ownership check: only owner or admin can delete
    const isOwner = resource.owner && resource.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resource' });
    }

    await Resource.findByIdAndDelete(req.params.id);

    if (resource.filePath) {
      await safelyDeleteStoredFile(resource.filePath);
    }

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get aggregated stats for dashboard analytics
 * @route   GET /api/resources/stats
 */
const getResourceStats = async (req, res, next) => {
  try {
    const [
      totalCount,
      byCategory,
      byDifficulty,
      avgRatingResult,
      overTime,
      topTags,
      sourceDistribution,
    ] = await Promise.all([
      // Total resources
      Resource.countDocuments(),

      // Resources by category
      Resource.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Resources by difficulty
      Resource.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Average rating
      Resource.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),

      // Resources created over last 30 days (grouped by date)
      Resource.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 most-used tags
      Resource.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Source distribution: File only, Link only, Both, Neither
      Resource.aggregate([
        {
          $project: {
            hasFile: { $gt: [{ $strLenCP: { $ifNull: ['$filePath', ''] } }, 0] },
            hasLink: { $gt: [{ $strLenCP: { $ifNull: ['$link', ''] } }, 0] },
          },
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $and: ['$hasFile', '$hasLink'] }, then: 'Both' },
                  { case: '$hasFile', then: 'File Only' },
                  { case: '$hasLink', then: 'Link Only' },
                ],
                default: 'No Source',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalResources: totalCount,
        byCategory,
        byDifficulty,
        averageRating: avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avgRating * 100) / 100 : 0,
        overTime,
        topTags,
        sourceDistribution,
      },
    });
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
  getResourceStats,
};
