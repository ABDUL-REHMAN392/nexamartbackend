import passport from "passport";
import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  oauthCallback,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── Register / Login ─────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);

// ─── Google OAuth ─────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
    session: false,
  }),
  oauthCallback,
);

// ─── Facebook OAuth ───────────────────────────────
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_failed`,
    session: false,
  }),
  oauthCallback,
);

export default router;
