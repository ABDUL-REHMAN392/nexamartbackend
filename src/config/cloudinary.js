import { v2 as cloudinary } from "cloudinary";

// ─── Cloudinary Config ────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Avatar Upload (Buffer se — memory storage) ───
export const uploadAvatarToCloudinary = (fileBuffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `nexamart/avatars`, // Organized folder structure
        public_id: `user_${userId}`, // userId se naam — purana auto replace
        overwrite: true, // Same public_id → purana replace ho jaye
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" }, // Face detect + crop
          { quality: "auto", fetch_format: "auto" }, // Auto optimize
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    uploadStream.end(fileBuffer); // Memory buffer seedha stream mein
  });
};

// ─── Avatar Delete ────────────────────────────────
export const deleteAvatarFromCloudinary = async (userId) => {
  try {
    await cloudinary.uploader.destroy(`nexamart/avatars/user_${userId}`);
  } catch (error) {
    // Delete fail ho to koi baat nahi — log karo bas
    console.error("Cloudinary delete error:", error.message);
  }
};

export default cloudinary;
