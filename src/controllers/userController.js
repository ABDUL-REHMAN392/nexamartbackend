import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "Profile retrieved successfully", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name && !phone)
      return errorResponse(
        res,
        400,
        "Please provide at least one field to update (name or phone)",
      );
    if (name !== undefined) {
      if (!name.trim()) return errorResponse(res, 400, "Name cannot be empty");
      if (name.trim().length < 2)
        return errorResponse(res, 400, "Name must be at least 2 characters");
      if (name.trim().length > 50)
        return errorResponse(res, 400, "Name cannot exceed 50 characters");
    }
    if (phone !== undefined) {
      if (!phone.trim())
        return errorResponse(res, 400, "Phone number cannot be empty");
      if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim()))
        return errorResponse(res, 400, "Please enter a valid phone number");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
      },
      { new: true, runValidators: true },
    );
    if (!user) return errorResponse(res, 404, "User not found");

    return successResponse(res, 200, "Profile updated successfully", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword)
      return errorResponse(res, 400, "Current password is required");
    if (!newPassword)
      return errorResponse(res, 400, "New password is required");
    if (newPassword.length < 8)
      return errorResponse(
        res,
        400,
        "New password must be at least 8 characters",
      );
    if (!/[A-Z]/.test(newPassword))
      return errorResponse(
        res,
        400,
        "New password must contain at least one uppercase letter",
      );
    if (!/[0-9]/.test(newPassword))
      return errorResponse(
        res,
        400,
        "New password must contain at least one number",
      );
    if (currentPassword === newPassword)
      return errorResponse(
        res,
        400,
        "New password must be different from current password",
      );

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return errorResponse(res, 404, "User not found");
    if (!user.password)
      return errorResponse(
        res,
        400,
        "This account uses social login and does not have a password",
      );

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return errorResponse(res, 400, "Current password is incorrect");

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(
      res,
      200,
      "Password changed successfully! Please login again",
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
