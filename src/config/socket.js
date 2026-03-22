import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createAndEmitNotification } from "../controllers/notificationController.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split("; ")
          .find((c) => c.startsWith("accessToken="))
          ?.split("=")[1];

      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select("_id role name");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(
      `🔌 Socket connected: ${user.name} (${user.role}) — ${socket.id}`,
    );

    if (user.role === "admin") socket.join("admins");
    socket.join(`user:${user._id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${user.name} — ${socket.id}`);
    });
  });

  return io;
};

const getAdminIds = async () => {
  const admins = await User.find({ role: "admin" }).select("_id");
  return admins.map((a) => a._id);
};

export const emitNewOrder = async (order) => {
  if (!io) return;
  try {
    const adminIds = await getAdminIds();
    await Promise.all(
      adminIds.map((adminId) =>
        createAndEmitNotification(io, {
          userId: adminId,
          type: "new_order",
          title: "New Order Received",
          message: `${order.user?.name || "A customer"} placed an order of $${Number(order.totalAmount).toFixed(2)}`,
          orderId: order._id,
        }),
      ),
    );
  } catch (err) {
    console.error("emitNewOrder error:", err.message);
  }
};

// Order status update — customer + admin
export const emitOrderStatusUpdate = async (order) => {
  if (!io) return;

  const payload = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
  };

  // Socket emit for real-time UI update (AdminOrders list)
  io.to(`user:${order.user}`).emit("order_status_update", payload);
  io.to("admins").emit("order_status_update", payload);

  try {
    if (order.orderStatus === "cancelled") {
      // Customer cancel — admin ko DB notification
      const adminIds = await getAdminIds();
      await Promise.all(
        adminIds.map((adminId) =>
          createAndEmitNotification(io, {
            userId: adminId,
            type: "customer_cancelled",
            title: "Order Cancelled by Customer",
            message: `Order #${order.orderNumber} has been cancelled by the customer`,
            orderId: order._id,
          }),
        ),
      );
    } else {
      // Status update — customer ko DB notification
      const statusMessages = {
        processing: "Your order is being processed",
        shipped: "Your order has been shipped and is on the way",
        delivered: "Your order has been delivered successfully 🎉",
      };
      const msg = statusMessages[order.orderStatus];
      if (msg) {
        await createAndEmitNotification(io, {
          userId: order.user,
          type: "order_status_update",
          title: `Order ${order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}`,
          message: `Order #${order.orderNumber} — ${msg}`,
          orderId: order._id,
        });
      }
    }
  } catch (err) {
    console.error("emitOrderStatusUpdate error:", err.message);
  }
};

// Admin cancel — customer ko notify
export const emitOrderCancelledByAdmin = async (order, refundInfo) => {
  if (!io) return;

  // Socket emit for real-time UI update
  io.to(`user:${order.user}`).emit("order_cancelled_by_admin", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    refund: refundInfo || null,
  });

  try {
    const refundMsg = refundInfo?.message ? ` ${refundInfo.message}` : "";
    await createAndEmitNotification(io, {
      userId: order.user,
      type: "order_cancelled_by_admin",
      title: "Order Cancelled by Store",
      message: `Order #${order.orderNumber} was cancelled by the store.${refundMsg}`,
      orderId: order._id,
    });
  } catch (err) {
    console.error("emitOrderCancelledByAdmin error:", err.message);
  }
};

// Order placed — customer confirmation
export const emitOrderPlaced = async (order) => {
  if (!io) return;
  try {
    await createAndEmitNotification(io, {
      userId: order.user,
      type: "order_placed",
      title: "Order Placed Successfully! 🎉",
      message: `Your order #${order.orderNumber} of $${Number(order.totalAmount).toFixed(2)} has been placed`,
      orderId: order._id,
    });
  } catch (err) {
    console.error("emitOrderPlaced error:", err.message);
  }
};

// New review — admins ko notify
export const emitNewReview = async (review, productTitle) => {
  if (!io) return;
  try {
    const adminIds = await getAdminIds();
    await Promise.all(
      adminIds.map((adminId) =>
        createAndEmitNotification(io, {
          userId: adminId,
          type: "new_review",
          title: "New Review Posted",
          message: `A new ${review.rating}★ review was posted on "${productTitle}"`,
          reviewId: review._id,
        }),
      ),
    );
  } catch (err) {
    console.error("emitNewReview error:", err.message);
  }
};

export const getIO = () => io;
