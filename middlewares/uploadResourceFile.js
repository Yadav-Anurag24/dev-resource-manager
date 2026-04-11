const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Aggressively sanitize: strip path traversal, null bytes, and non-alphanumeric chars
    const rawName = path.basename(file.originalname, path.extname(file.originalname));
    const safeBaseName = rawName
      .replace(/\0/g, '')                  // Remove null bytes
      .replace(/\.\./g, '')               // Remove path traversal
      .replace(/[^a-zA-Z0-9-_]/g, '-')    // Only allow safe characters
      .replace(/-{2,}/g, '-')             // Collapse multiple dashes
      .replace(/^-|-$/g, '')              // Trim leading/trailing dashes
      .toLowerCase()
      .slice(0, 100);                     // Cap base name length

    const finalBase = safeBaseName || 'file';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${finalBase}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'text/plain',
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error('Only PDF, DOC, DOCX, EPUB, and TXT files are allowed'));
  }
  cb(null, true);
};

const uploadResourceFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

module.exports = uploadResourceFile;
