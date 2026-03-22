import Favorite from "../models/Favorite.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const FAVORITES_LIMIT = 100;

// ─── Helper: productId validate + parse ──────────────────────────────────────
const parseProductId = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// ─── GET /api/favorites ───────────────────────────────────────────────────────
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean(); // plain JS objects — faster

    return successResponse(res, 200, "Favorites retrieved successfully", {
      favorites,
      total: favorites.length,
    });
  } catch (error) {
    console.error("[getFavorites]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── POST /api/favorites ──────────────────────────────────────────────────────
export const addFavorite = async (req, res) => {
  try {
    const { productId, title, price, image, brand, category, rating } =
      req.body;

    // Validate required fields
    const pid = parseProductId(productId);
    if (!pid) return errorResponse(res, 400, "Invalid or missing product ID");
    if (!title?.trim())
      return errorResponse(res, 400, "Product title is required");
    if (price == null || typeof price !== "number" || price < 0)
      return errorResponse(res, 400, "Invalid product price");
    if (!image?.trim())
      return errorResponse(res, 400, "Product image is required");

    // Limit check
    const count = await Favorite.countDocuments({ user: req.user._id });
    if (count >= FAVORITES_LIMIT)
      return errorResponse(
        res,
        400,
        `Favorites limit reached (${FAVORITES_LIMIT})`,
      );

    // Duplicate check
    const exists = await Favorite.findOne({
      user: req.user._id,
      productId: pid,
    });
    if (exists)
      return errorResponse(res, 409, "Product is already in your favorites");

    const favorite = await Favorite.create({
      user: req.user._id,
      productId: pid,
      title: title.trim(),
      price,
      image: image.trim(),
      brand: brand?.trim() || "",
      category: category?.trim() || "",
      rating: typeof rating === "number" ? rating : 0,
    });

    return successResponse(res, 201, "Added to favorites", { favorite });
  } catch (error) {
    if (error.code === 11000)
      return errorResponse(res, 409, "Product is already in your favorites");
    console.error("[addFavorite]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── DELETE /api/favorites/:productId ────────────────────────────────────────
export const removeFavorite = async (req, res) => {
  try {
    const pid = parseProductId(req.params.productId);
    if (!pid) return errorResponse(res, 400, "Invalid product ID");

    const deleted = await Favorite.findOneAndDelete({
      user: req.user._id,
      productId: pid,
    });

    if (!deleted)
      return errorResponse(res, 404, "Product not found in your favorites");

    return successResponse(res, 200, "Removed from favorites");
  } catch (error) {
    console.error("[removeFavorite]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── GET /api/favorites/:productId/check ─────────────────────────────────────
export const checkFavorite = async (req, res) => {
  try {
    const pid = parseProductId(req.params.productId);
    if (!pid) return errorResponse(res, 400, "Invalid product ID");

    const exists = await Favorite.exists({
      user: req.user._id,
      productId: pid,
    });

    return successResponse(res, 200, "Checked", { isFavorited: !!exists });
  } catch (error) {
    console.error("[checkFavorite]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── POST /api/favorites/toggle ──────────────────────────────────────────────
export const toggleFavorite = async (req, res) => {
  try {
    const { productId, title, price, image, brand, category, rating } =
      req.body;

    const pid = parseProductId(productId);
    if (!pid) return errorResponse(res, 400, "Invalid or missing product ID");

    // Already favorited → remove
    const existing = await Favorite.findOne({
      user: req.user._id,
      productId: pid,
    });
    if (existing) {
      await existing.deleteOne();
      return successResponse(res, 200, "Removed from favorites", {
        isFavorited: false,
      });
    }

    // Not favorited → validate then add
    if (!title?.trim())
      return errorResponse(res, 400, "Product title is required");
    if (price == null || typeof price !== "number" || price < 0)
      return errorResponse(res, 400, "Invalid product price");
    if (!image?.trim())
      return errorResponse(res, 400, "Product image is required");

    const count = await Favorite.countDocuments({ user: req.user._id });
    if (count >= FAVORITES_LIMIT)
      return errorResponse(
        res,
        400,
        `Favorites limit reached (${FAVORITES_LIMIT})`,
      );

    const favorite = await Favorite.create({
      user: req.user._id,
      productId: pid,
      title: title.trim(),
      price,
      image: image.trim(),
      brand: brand?.trim() || "",
      category: category?.trim() || "",
      rating: typeof rating === "number" ? rating : 0,
    });

    return successResponse(res, 201, "Added to favorites", {
      isFavorited: true,
      favorite,
    });
  } catch (error) {
    if (error.code === 11000)
      return errorResponse(res, 409, "Product is already in your favorites");
    console.error("[toggleFavorite]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// ─── DELETE /api/favorites ────────────────────────────────────────────────────
export const clearFavorites = async (req, res) => {
  try {
    const result = await Favorite.deleteMany({ user: req.user._id });

    if (result.deletedCount === 0)
      return errorResponse(res, 400, "Your favorites list is already empty");

    return successResponse(res, 200, "All favorites cleared", {
      removed: result.deletedCount,
    });
  } catch (error) {
    console.error("[clearFavorites]", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};
