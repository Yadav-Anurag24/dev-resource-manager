/**
 * Validation Middleware for Resource Creation/Update
 * Validates required fields before reaching the controller.
 */
const validateResource = (req, res, next) => {
  const { title, description, category, difficulty, link } = req.body;
  const errors = [];

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  // Description validation
  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  } else if (description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  // Category validation
  const validCategories = ['DSA', 'Backend', 'DevOps', 'AI'];
  if (!category) {
    errors.push('Category is required');
  } else if (!validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Difficulty validation
  const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
  if (!difficulty) {
    errors.push('Difficulty level is required');
  } else if (!validDifficulties.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  // Link validation
  if (!link || link.trim().length === 0) {
    errors.push('Resource link is required');
  }

  // If validation errors exist, re-render form with errors
  if (errors.length > 0) {
    return res.status(400).render('add', {
      title: 'Add Resource',
      errors,
      formData: req.body,
    });
  }

  next();
};

module.exports = validateResource;
