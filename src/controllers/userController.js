import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Favorite from "../models/Favorite.js";
import Review from "../models/Review.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  uploadAvatarToCloudinary,
  deleteAvatarFromCloudinary,
} from "../config/cloudinary.js";
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
      { returnDocument: "after", runValidators: true },
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

// POST /api/users/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return errorResponse(res, 400, "Please select an image to upload");

    const userId = req.user._id;
    const result = await uploadAvatarToCloudinary(req.file.buffer, userId);
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { returnDocument: "after" },
    );
    if (!user) return errorResponse(res, 404, "User not found");

    return successResponse(res, 200, "Avatar uploaded successfully", {
      avatar: user.avatar,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/users/avatar
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, "User not found");
    if (!user.avatar) return errorResponse(res, 400, "No avatar to remove");

    await deleteAvatarFromCloudinary(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { avatar: null });

    return successResponse(res, 200, "Avatar removed successfully");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/users/address
// Saved address lo — checkout pe pre-fill ke liye
export const getAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("savedAddress");
    if (!user) return errorResponse(res, 404, "User not found");

    if (!user.savedAddress)
      return successResponse(res, 200, "No saved address found", {
        savedAddress: null,
      });

    return successResponse(res, 200, "Address retrieved successfully", {
      savedAddress: user.savedAddress,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
// PUT /api/users/address
// Google Maps se select kiya hua address save karo
// Purana automatically replace ho jaye ga
export const saveAddress = async (req, res) => {
  try {
    const {
      formatted,
      street,
      city,
      state,
      country,
      postalCode,
      lat,
      lng,
      placeId,
    } = req.body;

    // Google Maps se kam se kam yeh fields aani chahiye
    if (!formatted || !formatted.trim())
      return errorResponse(res, 400, "Formatted address is required");
    if (!city || !city.trim())
      return errorResponse(res, 400, "City is required");
    if (!country || !country.trim())
      return errorResponse(res, 400, "Country is required");
    // lat/lng — frontend mein Google Maps nahi hai, string ya undefined aata hai
    // Sirf valid numbers accept karo, baaki ignore karo
    const parsedLat =
      lat !== undefined && lat !== "" && lat !== null ? parseFloat(lat) : null;
    const parsedLng =
      lng !== undefined && lng !== "" && lng !== null ? parseFloat(lng) : null;

    if (
      parsedLat !== null &&
      (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)
    )
      return errorResponse(res, 400, "Invalid latitude value");
    if (
      parsedLng !== null &&
      (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)
    )
      return errorResponse(res, 400, "Invalid longitude value");

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        savedAddress: {
          formatted: formatted.trim(),
          street: street?.trim() || "",
          city: city.trim(),
          state: state?.trim() || "",
          country: country.trim(),
          postalCode: postalCode?.trim() || "",
          lat: parsedLat,
          lng: parsedLng,
          placeId: placeId?.trim() || "",
        },
      },
      { returnDocument: "after" },
    );

    if (!user) return errorResponse(res, 404, "User not found");

    return successResponse(res, 200, "Address saved successfully", {
      savedAddress: user.savedAddress,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
// DELETE /api/users/profile
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body || {};

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return errorResponse(res, 404, "User not found");

    // Social login check — googleId ya facebookId ho to password ki zaroorat nahi
    const isSocialUser = !!(user.googleId || user.facebookId);

    if (!isSocialUser) {
      // Normal user — password required
      if (!password)
        return errorResponse(res, 400, "Password is required to delete your account");

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return errorResponse(res, 400, "Incorrect password");
    }

    // Avatar Cloudinary se delete karo
    if (user.avatar) {
      try {
        await deleteAvatarFromCloudinary(user._id);
      } catch {
        // Avatar delete fail — chalte rahte hain
      }
    }

    // Sab data delete karo
    await Promise.all([
      Cart.findOneAndDelete({ user: user._id }),
      Favorite.findOneAndDelete({ user: user._id }),
      Review.deleteMany({ user: user._id }),
    ]);

    // Account delete
    await user.deleteOne();

    // Cookies clear
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return successResponse(
      res,
      200,
      "Your account has been deleted successfully",
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};