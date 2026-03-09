import passport from "passport";
import express from "express";
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,
  updateEmail,
  oauthCallback,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── Registration ─────────────────────────────────
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// ─── Email Update ──────────
router.post("/update-email", updateEmail);

// ─── Login / Logout ───────────────────────────────
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);

// ─── Forgot Password — 3 Step ─────────────────────
// Step 1: Request Password Reset (Email Submission & OTP Generation)
router.post("/forgot-password", forgotPassword);
// Step 2: Validate OTP (Verification Token)
router.post("/verify-forgot-otp", verifyForgotOTP);
// Step 3: Update Password (New Credentials Submission)
router.post("/reset-password", resetPassword);

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
