import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import fs from "fs";
import stream from "stream";

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Buffer Upload Helpers (for memory storage / Vercel) ───────────────────

/**
 * Upload an image Buffer directly to Cloudinary.
 * Use this when multer uses memoryStorage (req.file.buffer).
 */
export const uploadBufferToCloud = (buffer, folder = "users") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          success: true,
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      },
    );

    const readable = new stream.PassThrough();
    readable.end(buffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Upload a file (raw/document) Buffer directly to Cloudinary.
 * Use this when multer uses memoryStorage for non-image uploads.
 */
export const uploadFileBufferToCloud = (buffer, folder = "expenses", filename = "file") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
        use_filename: true,
        unique_filename: true,
        public_id: filename,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          success: true,
          public_id: result.public_id,
          url: result.secure_url,
          name: result.original_filename,
          size: result.bytes,
          mime: result.format,
        });
      },
    );

    const readable = new stream.PassThrough();
    readable.end(buffer);
    readable.pipe(uploadStream);
  });
};

// ─── Path-based helpers (kept for reference, use buffer helpers in prod) ────

// upload function
export const uploadToCloud = async (file_path) => {
  try {
    if (!file_path) {
      throw new Error("File path is missing");
    }

    const result = await cloudinary.uploader.upload(file_path, {
      folder: "users",
      resource_type: "image",
    });

    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadFileToCloud = async (file_path, folder = "expenses") => {
  try {
    const result = await cloudinary.uploader.upload(file_path, {
      folder,
      resource_type: "raw",
      type: "upload",
      access_mode: "public",
      use_filename: true,
      unique_filename: true,
    });

    return {
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
      name: result.original_filename,
      size: result.bytes,
      mime: result.format,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload to Cloudinary and unlink local file
 */
export const uploadToCloudAndUnlink = async (file_path, folder = "clients") => {
  try {
    if (!file_path) {
      throw new Error("File path is missing");
    }

    const result = await cloudinary.uploader.upload(file_path, {
      folder,
      resource_type: "image",
    });

    // Unlink file from local storage
    if (fs.existsSync(file_path)) {
      fs.unlinkSync(file_path);
    }

    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload & unlink error:", error.message);

    // Try to unlink even if upload fails
    try {
      if (file_path && fs.existsSync(file_path)) {
        fs.unlinkSync(file_path);
      }
    } catch (e) {
      console.error("Error unlinking file after failed upload:", e.message);
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

export default cloudinary;
