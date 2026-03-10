import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Number,
      required: true,
    },
    // Product snapshot — DummyJSON se
    productTitle: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    // Sirf purchased users review de sakein
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Helpful votes
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Admin ne hide kiya
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1 });

export default mongoose.model("Review", reviewSchema);
