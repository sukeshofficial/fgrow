// middleware/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
// ensure uploads dir exists
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, safe);
  },
});

// file filter: allow images only (profile avatars)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, webp)"));
  }
};

// limits
const limits = {
  fileSize: 2 * 1024 * 1024, // 2 MB max
};

export const upload = multer({ storage, fileFilter, limits });

/* Nice to have:
 - S3 / cloud storage adapter (upload to S3 / GCS) for production.
 - Virus scan + image resizing pipeline.
*/
