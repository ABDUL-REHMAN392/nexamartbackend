import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup by user
    },

    // DummyJSON product ID
    productId: {
      type: Number,
      required: true,
    },

    // Snapshot — DummyJSON
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // thumbnail
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

favoriteSchema.index({ user: 1, productId: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
