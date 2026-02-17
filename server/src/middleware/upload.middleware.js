// middleware/upload.middleware.js
/**
 * File upload middleware
 *
 * Purpose:
 * - Handle multipart file uploads using multer.
 * - Store uploaded files on disk with safe filenames.
 * - Restrict uploads to image files only.
 */

import multer from "multer";
import path from "path";
import fs from "fs";

// Uploads directory
const uploadsDir = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName =
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g, "-");

    cb(null, safeName);
  },
});

// File filter: allow image files only
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowed.test(ext) ||
    allowed.test(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed (jpg, png, webp)",
      ),
    );
  }
};

// Upload limits
const limits = {
  fileSize: 2 * 1024 * 1024, // 2 MB max
};

// Export configured multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits,
});

/*
  Nice to have:
  - Cloud storage adapter (S3 / GCS)
  - Image resizing & optimization pipeline
  - Virus scanning before persistence
*/
