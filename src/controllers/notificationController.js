import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const createAndEmitNotification = async (
  io,
  { userId, type, title, message, orderId = null, reviewId = null },
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      orderId,
      reviewId,
    });

    // Real-time emit — agar user online hai toh turant mile
    if (io) {
      io.to(`user:${userId}`).emit("new_notification", {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        orderId: notification.orderId,
        reviewId: notification.reviewId,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    console.error("Notification create error:", err.message);
    return null;
  }
};

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Logged-in user ki saari notifications — newest first
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Max 50 — performance

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    return successResponse(res, 200, "Notifications retrieved", {
      notifications,
      unreadCount,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { returnDocument: "after" },
    );
    if (!notification) return errorResponse(res, 404, "Notification not found");

    return successResponse(res, 200, "Marked as read", { notification });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true },
    );
    return successResponse(res, 200, "All notifications marked as read");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notification) return errorResponse(res, 404, "Notification not found");

    return successResponse(res, 200, "Notification deleted");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─── DELETE /api/notifications ────────────────────────────────────────────────
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    return successResponse(res, 200, "All notifications deleted");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
