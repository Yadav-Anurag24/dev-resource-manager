const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resource must have an owner'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['DSA', 'Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'AI', 'Security', 'Mobile', 'Testing', 'System Design', 'Others'],
        message: '{VALUE} is not a valid category',
      },
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced'],
        message: '{VALUE} is not a valid difficulty level',
      },
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
    filePath: {
      type: String,
      default: '',
      trim: true,
    },
    fileMimeType: {
      type: String,
      default: '',
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: [0, 'File size cannot be negative'],
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering performance
resourceSchema.index({ title: 'text' });
resourceSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
