import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadAvatar as multerUpload,
  handleMulterError,
} from "../middlewares/Uploadmiddleware.js";

const router = express.Router();

// protected routes
router.use(protect);

// ─── Profile ──────────────────────────────────────
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// ─── Avatar ───────────────────────────────────────
router.post("/avatar", multerUpload, handleMulterError, uploadAvatar);
router.delete("/avatar", removeAvatar);

export default router;
