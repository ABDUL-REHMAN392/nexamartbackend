import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// IMPORTANT: /read-all MUST be before /:id — warna Express /:id se match kar leta hai
router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead); // ← pehle
router.delete("/", deleteAllNotifications);
router.patch("/:id/read", markAsRead); // ← baad mein
router.delete("/:id", deleteNotification);

export default router;
