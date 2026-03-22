import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Recipient — kis user ko yeh notification hai
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        // Admin notifications
        "new_order",
        "customer_cancelled",
        "new_review",
        // Customer notifications
        "order_status_update",
        "order_cancelled_by_admin",
        "order_placed",
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Related order ya review ka ID — click karne pe navigate karne ke liye
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },

    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
