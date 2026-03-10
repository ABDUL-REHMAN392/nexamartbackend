import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1, max: 10, default: 1 },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Har user ka sirf ek cart
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// ─── Virtuals ─────────────────────────────────────

// Total items count
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Total price
cartSchema.virtual("totalPrice").get(function () {
  return parseFloat(
    this.items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2),
  );
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

export default mongoose.model("Cart", cartSchema);
