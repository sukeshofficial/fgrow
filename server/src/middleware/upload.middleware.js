import multer from "multer";
import path from "path";

// ─── Memory Storage ────────────────────────────────────────────────────────
// Vercel serverless containers have a read-only filesystem.
// We store uploaded files in memory (req.file.buffer) and stream them
// directly to Cloudinary — no local disk writes ever happen.
const memoryStorage = multer.memoryStorage();

// File filter: images only
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, webp)"));
  }
};

// File filter: documents + images
const fileFilterFiles = (_req, file, cb) => {
  const allowedExt = /\.(pdf|doc|docx|xls|xlsx|csv|txt|zip|jpeg|jpg|png|webp)$/i;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExt.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "File type not allowed. Allowed: pdf, doc, docx, xls, xlsx, csv, txt, zip, jpg, png, webp",
      ),
    );
  }
};

// Image uploads (2 MB limit)
export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Document / file uploads (10 MB limit)
export const uploadFiles = multer({
  storage: memoryStorage,
  fileFilter: fileFilterFiles,
  limits: { fileSize: 10 * 1024 * 1024 },
});
