import multer from "multer";

// ─── Memory Storage ──────────────────────────────────
const storage = multer.memoryStorage();

// ─── File Filter (sirf images allow) ─────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
  }
};

// ─── Multer Instance ──────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

// ─── Single Avatar Upload ─────────────────────────
export const uploadAvatar = upload.single("avatar");
