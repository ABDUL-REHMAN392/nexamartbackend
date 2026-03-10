import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-active", toggleUserActive);

export default router;
