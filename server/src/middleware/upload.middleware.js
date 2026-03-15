import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");

    cb(null, safeName);
  },
});

// File filter: allow image files only
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, webp)"));
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

const filesDir = path.join(uploadsDir, "files");
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });

const storageFiles = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, filesDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-")),
});

const fileFilterFiles = (_req, file, cb) => {
  const allowedExt =
    /\.(pdf|doc|docx|xls|xlsx|csv|txt|zip|jpeg|jpg|png|webp)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExt.test(ext) || allowedExt.test(file.mimetype)) cb(null, true);
  else
    cb(
      new Error(
        "File type not allowed. Allowed: pdf, doc, docx, xls, xlsx, csv, txt, zip, jpg, png, webp",
      ),
    );
};

export const uploadFiles = multer({
  storage: storageFiles,
  fileFilter: fileFilterFiles,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});
