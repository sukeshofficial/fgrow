import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

export default cloudinary;
