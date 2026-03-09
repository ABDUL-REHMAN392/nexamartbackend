import Favorite from "../models/Favorite.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const FAVORITES_LIMIT = 100;

// GET /api/favorites
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).sort({
      createdAt: -1,
    }); // Latest pehle

    return successResponse(res, 200, "Favorites retrieved successfully", {
      favorites,
      total: favorites.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/favorites
export const addFavorite = async (req, res) => {
  try {
    const { productId, title, price, image, brand, category, rating } =
      req.body;

    // Validations
    if (!productId) return errorResponse(res, 400, "Product ID is required");
    if (typeof productId !== "number" || productId <= 0)
      return errorResponse(res, 400, "Invalid product ID");
    if (!title || !title.trim())
      return errorResponse(res, 400, "Product title is required");
    if (price === undefined || price === null)
      return errorResponse(res, 400, "Product price is required");
    if (typeof price !== "number" || price < 0)
      return errorResponse(res, 400, "Invalid product price");
    if (!image || !image.trim())
      return errorResponse(res, 400, "Product image is required");

    // Limit check
    const count = await Favorite.countDocuments({ user: req.user._id });
    if (count >= FAVORITES_LIMIT)
      return errorResponse(
        res,
        400,
        `You can only save up to ${FAVORITES_LIMIT} favorites`,
      );

    // Already favorited?
    const existing = await Favorite.findOne({
      user: req.user._id,
      productId,
    });
    if (existing)
      return errorResponse(res, 400, "Product is already in your favorites");

    const favorite = await Favorite.create({
      user: req.user._id,
      productId,
      title: title.trim(),
      price,
      image: image.trim(),
      brand: brand?.trim() || "",
      category: category?.trim() || "",
      rating: rating || 0,
    });

    return successResponse(res, 201, "Added to favorites", { favorite });
  } catch (error) {
    // Duplicate key — race condition handle
    if (error.code === 11000)
      return errorResponse(res, 400, "Product is already in your favorites");
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/favorites/:productId
export const removeFavorite = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId) || productId <= 0)
      return errorResponse(res, 400, "Invalid product ID");

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      productId,
    });

    if (!favorite)
      return errorResponse(res, 404, "Product not found in your favorites");

    return successResponse(res, 200, "Removed from favorites");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/favorites/:productId/check
export const checkFavorite = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId) || productId <= 0)
      return errorResponse(res, 400, "Invalid product ID");

    const favorite = await Favorite.findOne({
      user: req.user._id,
      productId,
    });

    return successResponse(res, 200, "Checked", {
      isFavorited: !!favorite,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/favorites/toggle
export const toggleFavorite = async (req, res) => {
  try {
    const { productId, title, price, image, brand, category, rating } =
      req.body;

    if (!productId) return errorResponse(res, 400, "Product ID is required");
    if (typeof productId !== "number" || productId <= 0)
      return errorResponse(res, 400, "Invalid product ID");

    // Pehle se hai?
    const existing = await Favorite.findOne({
      user: req.user._id,
      productId,
    });

    if (existing) {
      // Remove karo
      await existing.deleteOne();
      return successResponse(res, 200, "Removed from favorites", {
        isFavorited: false,
      });
    }

    // Add karo — validations
    if (!title || !title.trim())
      return errorResponse(res, 400, "Product title is required");
    if (price === undefined || price === null)
      return errorResponse(res, 400, "Product price is required");
    if (!image || !image.trim())
      return errorResponse(res, 400, "Product image is required");

    // Limit check
    const count = await Favorite.countDocuments({ user: req.user._id });
    if (count >= FAVORITES_LIMIT)
      return errorResponse(
        res,
        400,
        `You can only save up to ${FAVORITES_LIMIT} favorites`,
      );

    const favorite = await Favorite.create({
      user: req.user._id,
      productId,
      title: title.trim(),
      price,
      image: image.trim(),
      brand: brand?.trim() || "",
      category: category?.trim() || "",
      rating: rating || 0,
    });

    return successResponse(res, 201, "Added to favorites", {
      isFavorited: true,
      favorite,
    });
  } catch (error) {
    if (error.code === 11000)
      return errorResponse(res, 400, "Product is already in your favorites");
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/favorites
export const clearFavorites = async (req, res) => {
  try {
    const result = await Favorite.deleteMany({ user: req.user._id });

    if (result.deletedCount === 0)
      return errorResponse(res, 400, "Your favorites list is already empty");

    return successResponse(res, 200, "All favorites cleared", {
      removed: result.deletedCount,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
