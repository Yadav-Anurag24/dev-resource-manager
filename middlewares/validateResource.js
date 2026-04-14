const fs = require('fs/promises');

/**
 * Validation Middleware for Resource Creation/Update
 * Validates required fields before reaching the controller.
 */
const validateResource = (req, res, next) => {
  const { title, description, category, difficulty, link, existingFilePath } = req.body;
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
  const validCategories = ['DSA', 'Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'AI', 'Security', 'Mobile', 'Testing', 'System Design', 'Others'];
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

  // Source validation: at least one of link or file must exist
  const linkValue = typeof link === 'string' ? link.trim() : '';
  const hasUploadedFile = Boolean(req.file);
  const hasExistingFile = typeof existingFilePath === 'string' && existingFilePath.trim().length > 0;

  if (!linkValue && !hasUploadedFile && !hasExistingFile) {
    errors.push('Provide at least one resource source: link or uploaded file');
  }

  if (linkValue) {
    try {
      const parsed = new URL(linkValue);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push('Resource link must start with http:// or https://');
      }
    } catch {
      errors.push('Resource link must be a valid URL');
    }
  }

  if (errors.length > 0) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = validateResource;
