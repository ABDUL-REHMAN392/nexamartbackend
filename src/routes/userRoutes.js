import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,

} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// protected routes
router.use(protect);

// ─── Profile ──────────────────────────────────────
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

export default router;