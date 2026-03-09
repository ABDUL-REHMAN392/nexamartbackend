import express from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  toggleFavorite,
  clearFavorites,
} from "../controllers/favoriteController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// protected routes
router.use(protect);

// ─── Favorites ────────────────────────────────────
router.get("/", getFavorites); // Saare favorites
router.post("/", addFavorite); // Add karo
router.post("/toggle", toggleFavorite); // Toggle — frontend ke liye easy
router.delete("/", clearFavorites); // Saare clear karo
router.get("/:productId/check", checkFavorite); // Heart icon check
router.delete("/:productId", removeFavorite); // Ek remove karo

export default router;
