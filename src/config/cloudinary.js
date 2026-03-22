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
        folder: `nexamart/avatars`,
        public_id: `user_${userId}`, // userId se naam — purana auto replace
        overwrite: true,
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

// ─── Avatar Delete ────────────────────────────────
export const deleteAvatarFromCloudinary = async (userId) => {
  try {
    const result = await cloudinary.uploader.destroy(
      `nexamart/avatars/user_${userId}`,
    );
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    return false;
  }
};

export default cloudinary;
