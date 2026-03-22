import mongoose from "mongoose";

// ─── Order Item Snapshot ──────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    weight: { type: Number, default: 0 }, // kg per item
    subtotal: { type: Number, required: true }, // price * quantity
  },
  { _id: false },
);

// ─── Address Snapshot ─────────────────────────────
const addressSnapshotSchema = new mongoose.Schema(
  {
    formatted: { type: String, required: true },
    street: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    country: { type: String, required: true },
    postalCode: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false },
);

// ─── Order Schema ─────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // ── User ───────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Order Number (readable) ────────────────────
    orderNumber: {
      type: String,
      unique: true,
    },

    // ── Items Snapshot ─────────────────────────────
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must have at least one item",
      },
    },

    // ── Address Snapshot ───────────────────────────
    deliveryAddress: {
      type: addressSnapshotSchema,
      required: true,
    },

    // ── Pricing ────────────────────────────────────
    itemsTotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // ── Weight ─────────────────────────────────────
    totalWeightKg: { type: Number, default: 0 }, // cart ka total weight

    // ── Payment ────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    stripePaymentIntentId: { type: String, default: null },

    // ── Order Status ───────────────────────────────
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    // ── Cancel Info ────────────────────────────────
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },

    // ── Timestamps ─────────────────────────────────
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// ─── Auto Order Number ────────────────────────────
orderSchema.pre("save", async function () {
  if (!this.isNew) return;

  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");

  const random = Math.floor(10000 + Math.random() * 90000);
  this.orderNumber = `NXM-${dateStr}-${random}`;
});

export default mongoose.model("Order", orderSchema);
