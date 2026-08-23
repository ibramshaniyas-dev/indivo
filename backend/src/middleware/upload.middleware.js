const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIMES = [...IMAGE_MIMES, 'application/pdf'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createUploader(subdir, allowedMimes) {
  const dir = path.join(process.cwd(), env.upload.dir, subdir);
  ensureDir(dir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      file.fieldSubdir = subdir;
      cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  });
}

module.exports = {
  uploadCategoryImage: createUploader('categories', IMAGE_MIMES),
  uploadBrandLogo: createUploader('brands', IMAGE_MIMES),
  uploadProductMedia: createUploader('products', IMAGE_MIMES),
  uploadSellerDocument: createUploader('seller-documents', DOCUMENT_MIMES),
  uploadProfileImage: createUploader('profiles', IMAGE_MIMES),
  uploadReviewImage: createUploader('reviews', IMAGE_MIMES),
};
