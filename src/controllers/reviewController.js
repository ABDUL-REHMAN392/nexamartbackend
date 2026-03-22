import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// ─── Helper: Verified Purchase Check ──────────────
const checkVerifiedPurchase = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    "items.productId": productId,
    orderStatus: { $in: ["delivered"] },
    paymentStatus: "paid",
  });
  return !!order;
};

// POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { productId, productTitle, productImage, rating, title, body } =
      req.body;

    if (!productId) return errorResponse(res, 400, "Product ID is required");
    if (!productTitle)
      return errorResponse(res, 400, "Product title is required");
    if (!rating) return errorResponse(res, 400, "Rating is required");
    if (rating < 1 || rating > 5)
      return errorResponse(res, 400, "Rating must be between 1 and 5");
    if (!title || !title.trim())
      return errorResponse(res, 400, "Review title is required");
    if (title.trim().length > 100)
      return errorResponse(res, 400, "Title cannot exceed 100 characters");
    if (!body || !body.trim())
      return errorResponse(res, 400, "Review body is required");
    if (body.trim().length < 10)
      return errorResponse(res, 400, "Review must be at least 10 characters");
    if (body.trim().length > 1000)
      return errorResponse(res, 400, "Review cannot exceed 1000 characters");

    // Duplicate check
    const existing = await Review.findOne({
      user: req.user._id,
      productId,
    });
    if (existing)
      return errorResponse(
        res,
        400,
        "You have already reviewed this product. You can edit your existing review.",
      );

    // Verified purchase check
    const verifiedPurchase = await checkVerifiedPurchase(
      req.user._id,
      productId,
    );

    const review = await Review.create({
      user: req.user._id,
      productId,
      productTitle: productTitle.trim(),
      productImage: productImage || "",
      rating,
      title: title.trim(),
      body: body.trim(),
      verifiedPurchase,
    });

    await review.populate("user", "name avatar");

    return successResponse(res, 201, "Review submitted successfully", {
      review,
    });
  } catch (error) {
    if (error.code === 11000)
      return errorResponse(res, 400, "You have already reviewed this product");
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// GET /api/reviews/product/:productId
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "newest"; // newest, oldest, highest, lowest, helpful
    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
      helpful: { helpfulVotes: -1 },
    };

    const filter = {
      productId: parseInt(productId),
      isHidden: false,
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name avatar")
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    // Rating summary
    const ratingSummary = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    const summary = ratingSummary[0] || {
      averageRating: 0,
      totalReviews: 0,
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    return successResponse(res, 200, "Reviews retrieved successfully", {
      reviews,
      summary: {
        averageRating: parseFloat((summary.averageRating || 0).toFixed(1)),
        totalReviews: summary.totalReviews,
        breakdown: {
          5: summary[5],
          4: summary[4],
          3: summary[3],
          2: summary[2],
          1: summary[1],
        },
      },
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// GET /api/reviews/my
export const getMyReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ user: req.user._id, isHidden: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ user: req.user._id, isHidden: false }),
    ]);

    return successResponse(res, 200, "Your reviews retrieved successfully", {
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// GET /api/reviews/check/:productId
export const checkMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      user: req.user._id,
      productId: parseInt(req.params.productId),
    });

    return successResponse(res, 200, "Review check successful", {
      hasReviewed: !!review,
      review: review || null,
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// PUT /api/reviews/:id
export const updateReview = async (req, res) => {
  try {
    const { rating, title, body } = req.body;

    if (!rating && !title && !body)
      return errorResponse(
        res,
        400,
        "Please provide at least one field to update",
      );
    if (rating && (rating < 1 || rating > 5))
      return errorResponse(res, 400, "Rating must be between 1 and 5");
    if (title && title.trim().length > 100)
      return errorResponse(res, 400, "Title cannot exceed 100 characters");
    if (body && body.trim().length < 10)
      return errorResponse(res, 400, "Review must be at least 10 characters");
    if (body && body.trim().length > 1000)
      return errorResponse(res, 400, "Review cannot exceed 1000 characters");

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!review) return errorResponse(res, 404, "Review not found");
    if (review.isHidden)
      return errorResponse(res, 400, "This review has been hidden by admin");

    if (rating) review.rating = rating;
    if (title) review.title = title.trim();
    if (body) review.body = body.trim();
    await review.save();

    await review.populate("user", "name avatar");

    return successResponse(res, 200, "Review updated successfully", { review });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!review) return errorResponse(res, 404, "Review not found");

    await review.deleteOne();
    return successResponse(res, 200, "Review deleted successfully");
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// POST /api/reviews/:id/helpful
export const toggleHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.isHidden)
      return errorResponse(res, 404, "Review not found");

    // Apni review pe vote nahi de sakte
    if (review.user.toString() === req.user._id.toString())
      return errorResponse(res, 400, "You cannot vote on your own review");

    const alreadyVoted = review.helpfulVotes.includes(req.user._id);

    if (alreadyVoted) {
      review.helpfulVotes.pull(req.user._id);
    } else {
      review.helpfulVotes.push(req.user._id);
    }
    await review.save();

    return successResponse(
      res,
      200,
      alreadyVoted ? "Vote removed" : "Marked as helpful",
      {
        helpfulCount: review.helpfulVotes.length,
        isHelpful: !alreadyVoted,
      },
    );
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── Admin Routes ──────────────────────────────────

// GET /api/reviews/admin/all
export const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const productId = req.query.productId;
    const hidden = req.query.hidden;

    const filter = {};
    if (productId) filter.productId = parseInt(productId);
    if (hidden === "true") filter.isHidden = true;
    if (hidden === "false") filter.isHidden = false;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return successResponse(res, 200, "All reviews retrieved", {
      reviews,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// PUT /api/reviews/admin/:id/hide
export const toggleHideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    review.isHidden = !review.isHidden;
    await review.save();

    return successResponse(
      res,
      200,
      review.isHidden
        ? "Review hidden successfully"
        : "Review unhidden successfully",
      { isHidden: review.isHidden },
    );
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// DELETE /api/reviews/admin/:id
export const adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");
    return successResponse(res, 200, "Review deleted by admin");
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};
