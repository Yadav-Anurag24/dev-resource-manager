const Resource = require('../models/Resource');

/**
 * @desc    List all resources with filtering and search
 * @route   GET /resources
 */
const getAllResources = async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;
    const filter = {};

    // Filter by category
    if (category && category !== '') {
      filter.category = category;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== '') {
      filter.difficulty = difficulty;
    }

    // Search by title keyword (case-insensitive)
    if (search && search.trim() !== '') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });

    res.render('index', {
      title: 'All Resources',
      resources,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Render add resource form
 * @route   GET /resources/new
 */
const renderAddForm = (req, res) => {
  res.render('add', {
    title: 'Add Resource',
    errors: [],
    formData: {},
  });
};

/**
 * @desc    Create a new resource
 * @route   POST /resources
 */
const createResource = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, link, tags, rating } = req.body;

    // Process tags: split comma-separated string into array
    const processedTags = tags
      ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    const resource = new Resource({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      link: link.trim(),
      tags: processedTags,
      rating: rating ? Number(rating) : 0,
    });

    await resource.save();
    res.redirect('/resources');
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).render('add', {
        title: 'Add Resource',
        errors,
        formData: req.body,
      });
    }
    next(err);
  }
};

/**
 * @desc    View resource details
 * @route   GET /resources/:id
 */
const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    res.render('details', {
      title: resource.title,
      resource,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Render edit resource form
 * @route   GET /resources/:id/edit
 */
const renderEditForm = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    res.render('edit', {
      title: 'Edit Resource',
      resource,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a resource
 * @route   PUT /resources/:id
 */
const updateResource = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, link, tags, rating } = req.body;

    // Process tags
    const processedTags = tags
      ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    const updatedData = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      link: link.trim(),
      tags: processedTags,
      rating: rating ? Number(rating) : 0,
    };

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!resource) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    res.redirect(`/resources/${resource._id}`);
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      const resource = await Resource.findById(req.params.id);
      return res.status(400).render('edit', {
        title: 'Edit Resource',
        resource: { ...resource?.toObject(), ...req.body, _id: req.params.id },
        errors,
      });
    }
    next(err);
  }
};

/**
 * @desc    Delete a resource
 * @route   DELETE /resources/:id
 */
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    res.redirect('/resources');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllResources,
  renderAddForm,
  createResource,
  getResourceById,
  renderEditForm,
  updateResource,
  deleteResource,
};
