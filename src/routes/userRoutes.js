import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
  getAddress,
  saveAddress,
  deleteAccount,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadAvatar as multerUpload } from "../middlewares/Uploadmiddleware.js";

const router = express.Router();

router.use(protect);

// ─── Profile ──────────────────────────────────────
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// ─── Avatar ───────────────────────────────────────
router.post("/avatar", multerUpload, uploadAvatar);
router.delete("/avatar", removeAvatar);

// ─── Address ──────────────────────────────────────
router.get("/address", getAddress);
router.put("/address", saveAddress);

// ─── Delete Account ───────────────────────────────
router.delete("/profile", deleteAccount);

export default router;