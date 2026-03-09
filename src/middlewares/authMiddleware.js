import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/apiResponse.js";

// ─── Protect Route ────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, 401, "Unauthorized. Please login to continue");
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user)
      return errorResponse(res, 401, "User not found. Please login again");
    if (!user.isActive)
      return errorResponse(
        res,
        403,
        "Your account has been banned. Please contact support",
      );

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Session expired. Please login again");
    }
    return errorResponse(res, 401, "Invalid token. Please login again");
  }
};

// ─── Admin Only ───────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return errorResponse(res, 403, "Access denied. Admins only");
  }
  next();
};

// ─── Email Verified ───────────────────────────────
export const emailVerified = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return errorResponse(
      res,
      403,
      "Please verify your email before continuing",
    );
  }
  next();
};
