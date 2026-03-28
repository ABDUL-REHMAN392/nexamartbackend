import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../utils/tokenUtils.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !name.trim())
      return errorResponse(res, 400, "Name is required");
    if (name.trim().length < 2)
      return errorResponse(res, 400, "Name must be at least 2 characters");
    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return errorResponse(res, 400, "Please enter a valid email address");
    if (!password) return errorResponse(res, 400, "Password is required");
    if (password.length < 8)
      return errorResponse(res, 400, "Password must be at least 8 characters");
    if (!/[A-Z]/.test(password))
      return errorResponse(
        res,
        400,
        "Password must contain at least one uppercase letter",
      );
    if (!/[0-9]/.test(password))
      return errorResponse(
        res,
        400,
        "Password must contain at least one number",
      );

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return errorResponse(res, 400, "This email is already registered");

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone,
      isEmailVerified: true,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return successResponse(
      res,
      201,
      "Account created successfully! Welcome 🎉",
      {
        accessToken,
        user: user.toSafeObject(),
      },
    );
  } catch (error) {
    console.error("register error:", error);
    return errorResponse(res, 500, "Registration failed. Please try again.");
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!password) return errorResponse(res, 400, "Password is required");

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");
    if (!user) return errorResponse(res, 401, "Invalid email or password");
    if (!user.isActive)
      return errorResponse(
        res,
        403,
        "Your account has been banned, please contact support",
      );

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return errorResponse(
        res,
        423,
        `Account is locked. Please try again in ${minutesLeft} minute(s)`,
      );
    }

    if (!user.password)
      return errorResponse(
        res,
        400,
        "This account was registered with Google/Facebook, please use social login",
      );

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        return errorResponse(
          res,
          423,
          "Too many failed attempts, account locked for 30 minutes",
        );
      }
      await user.save();
      return errorResponse(
        res,
        401,
        `Invalid password. ${5 - user.loginAttempts} attempt(s) remaining`,
      );
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return successResponse(res, 200, "Login successful!", {
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("login error:", error);
    return errorResponse(res, 500, "Login failed. Please try again.");
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Token expired ya invalid — cookies clear karna kaafi hai
      }
    }
    clearAuthCookies(res);
    return successResponse(res, 200, "Logged out successfully!");
  } catch (error) {
    console.error("logout error:", error);
    return errorResponse(res, 500, "Logout failed. Please try again.");
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return errorResponse(res, 401, "Session expired. Please login again");

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token)
      return errorResponse(res, 401, "Invalid session. Please login again");

    const accessToken = generateAccessToken(user._id);
    setAccessTokenCookie(res, accessToken);

    return successResponse(res, 200, "Token refreshed", { accessToken });
  } catch (error) {
    return errorResponse(res, 401, "Session expired. Please login again");
  }
};
// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    return successResponse(res, 200, "Authenticated", {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    console.error("getMe error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// OAuth Callback
export const oauthCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    console.error("FRONTEND_URL env variable is not set");
    return res
      .status(500)
      .json({ success: false, message: "Server configuration error" });
  }

  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.redirect(`${frontendUrl}/oauth-success`);
  } catch (error) {
    console.error("oauthCallback error:", error);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};
