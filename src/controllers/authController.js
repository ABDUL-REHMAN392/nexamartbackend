import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  generateOTP,
  getOTPExpiry,
} from "../utils/tokenUtils.js";
import {
  sendVerificationOTP,
  sendForgotPasswordOTP,
  sendEmailUpdateOTP,
  sendWelcomeEmail,
} from "../services/emailService.js";
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

    const existing = await User.findOne({ email });
    if (existing)
      return errorResponse(res, 400, "This email is already registered");

    const otp = generateOTP();
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone,
      emailOTP: otp,
      emailOTPExpiry: getOTPExpiry(10),
      isEmailVerified: false,
    });

    await sendVerificationOTP(user, otp);
    return successResponse(
      res,
      201,
      "Account created! Please check your email and verify with OTP",
      {
        userId: user._id,
        email: user.email,
      },
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!otp || !otp.trim()) return errorResponse(res, 400, "OTP is required");
    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim()))
      return errorResponse(res, 400, "OTP must be a 6-digit number");

    const user = await User.findOne({ email }).select(
      "+emailOTP +emailOTPExpiry",
    );
    if (!user)
      return errorResponse(res, 404, "No account found with this email");
    if (user.isEmailVerified)
      return errorResponse(res, 400, "Email is already verified");
    if (user.emailOTP !== otp.trim())
      return errorResponse(res, 400, "Invalid OTP");
    if (user.emailOTPExpiry < Date.now())
      return errorResponse(
        res,
        400,
        "OTP has expired, please request a new one",
      );

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await sendWelcomeEmail(user);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return successResponse(
      res,
      200,
      "Email verified successfully! Welcome 🎉",
      {
        accessToken,
        user: user.toSafeObject(),
      },
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return errorResponse(res, 400, "Please enter a valid email address");

    const user = await User.findOne({ email });
    if (!user)
      return errorResponse(res, 404, "No account found with this email");
    if (user.isEmailVerified)
      return errorResponse(res, 400, "Email is already verified");

    if (user.otpResendAt && user.otpResendAt > Date.now()) {
      const waitSeconds = Math.ceil((user.otpResendAt - Date.now()) / 1000);
      return errorResponse(
        res,
        429,
        `Please wait ${waitSeconds} seconds before requesting a new OTP`,
      );
    }

    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExpiry = getOTPExpiry(10);
    user.otpResendAt = new Date(Date.now() + 60 * 1000);
    await user.save();

    await sendVerificationOTP(user, otp);
    return successResponse(res, 200, "A new OTP has been sent to your email");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return errorResponse(res, 400, "Please enter a valid email address");
    if (!password) return errorResponse(res, 400, "Password is required");

    const user = await User.findOne({ email }).select("+password");
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

    if (!user.password) {
      return errorResponse(
        res,
        400,
        "This account was registered with Google/Facebook, please use social login",
      );
    }

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

    if (!user.isEmailVerified) {
      const otp = generateOTP();
      user.emailOTP = otp;
      user.emailOTPExpiry = getOTPExpiry(10);
      await user.save();
      await sendVerificationOTP(user, otp);
      return errorResponse(
        res,
        403,
        "Email not verified. A new OTP has been sent to your email",
        {
          requiresVerification: true,
          email: user.email,
        },
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
    return errorResponse(res, 500, error.message);
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

    // ✅ Naya accessToken banao aur cookie mein bhi set karo
    const accessToken = generateAccessToken(user._id);
    setAccessTokenCookie(res, accessToken);

    return successResponse(res, 200, "Token refreshed successfully", {
      accessToken,
    });
  } catch (error) {
    return errorResponse(res, 401, "Session expired. Please login again");
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    // DB se bhi refreshToken hatao agar cookie available ho
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Expired token — koi baat nahi, cookies clear karo
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logged out successfully!");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/forgot-password
// Step 1: Email daalo → OTP jaye → verify karo
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return errorResponse(res, 400, "Please enter a valid email address");

    const user = await User.findOne({ email });

    // Security: same message (email enumeration rokta hai)
    if (!user)
      return successResponse(
        res,
        200,
        "If this email is registered, an OTP has been sent",
      );

    if (!user.password && (user.googleId || user.facebookId))
      return errorResponse(
        res,
        400,
        "This account uses social login and does not have a password",
      );

    const otp = generateOTP();
    user.passwordResetOTP = otp;
    user.passwordResetExpiry = getOTPExpiry(10); // 10 min
    await user.save();

    await sendForgotPasswordOTP(user, otp);
    return successResponse(
      res,
      200,
      "A verification code has been sent to your email",
      {
        email: user.email,
      },
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/verify-forgot-otp
// Step 2: OTP verify karo → reset token milega
export const verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!otp || !otp.trim()) return errorResponse(res, 400, "OTP is required");
    if (!/^\d{6}$/.test(otp.trim()))
      return errorResponse(res, 400, "OTP must be a 6-digit number");

    const user = await User.findOne({ email }).select(
      "+passwordResetOTP +passwordResetExpiry",
    );
    if (!user)
      return errorResponse(res, 404, "No account found with this email");
    if (user.passwordResetOTP !== otp.trim())
      return errorResponse(res, 400, "Invalid OTP");
    if (user.passwordResetExpiry < Date.now())
      return errorResponse(
        res,
        400,
        "OTP has expired, please request a new one",
      );

    // OTP sahi hai — reset allow karo
    // resetVerified flag set karo 15 min ke liye
    user.passwordResetOTP = "VERIFIED";
    user.passwordResetExpiry = getOTPExpiry(15); // 15 min mein password reset karo
    await user.save();

    return successResponse(
      res,
      200,
      "OTP verified successfully! You can now reset your password",
      {
        email: user.email,
      },
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/reset-password
// Step 3: Naya password set karo
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !email.trim())
      return errorResponse(res, 400, "Email is required");
    if (!newPassword)
      return errorResponse(res, 400, "New password is required");
    if (newPassword.length < 8)
      return errorResponse(res, 400, "Password must be at least 8 characters");
    if (!/[A-Z]/.test(newPassword))
      return errorResponse(
        res,
        400,
        "Password must contain at least one uppercase letter",
      );
    if (!/[0-9]/.test(newPassword))
      return errorResponse(
        res,
        400,
        "Password must contain at least one number",
      );

    const user = await User.findOne({ email }).select(
      "+passwordResetOTP +passwordResetExpiry",
    );
    if (!user)
      return errorResponse(res, 404, "No account found with this email");

    // Check: OTP verify hua tha?
    if (user.passwordResetOTP !== "VERIFIED")
      return errorResponse(res, 400, "Please verify your OTP first");
    if (user.passwordResetExpiry < Date.now())
      return errorResponse(res, 400, "Session expired, please start again");

    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(
      res,
      200,
      "Password reset successfully! Please login with your new password",
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/auth/update-email
// Unverified user galat email fix kare
export const updateEmail = async (req, res) => {
  try {
    const { currentEmail, newEmail } = req.body;

    if (!currentEmail || !currentEmail.trim())
      return errorResponse(res, 400, "Current email is required");
    if (!newEmail || !newEmail.trim())
      return errorResponse(res, 400, "New email is required");
    if (!/^\S+@\S+\.\S+$/.test(newEmail))
      return errorResponse(res, 400, "Please enter a valid email address");
    if (currentEmail.toLowerCase() === newEmail.toLowerCase())
      return errorResponse(
        res,
        400,
        "New email must be different from current email",
      );

    // Current email se user dhundo
    const user = await User.findOne({ email: currentEmail.toLowerCase() });
    if (!user)
      return errorResponse(res, 404, "No account found with this email");

    // Sirf unverified user email change kar sakta hai
    if (user.isEmailVerified)
      return errorResponse(
        res,
        400,
        "Verified accounts cannot change email from here. Use profile settings",
      );

    // Naya email pehle se kisi aur ka to nahi?
    const emailTaken = await User.findOne({ email: newEmail.toLowerCase() });
    if (emailTaken)
      return errorResponse(
        res,
        400,
        "This email is already registered with another account",
      );

    // Resend cooldown check
    if (user.otpResendAt && user.otpResendAt > Date.now()) {
      const waitSeconds = Math.ceil((user.otpResendAt - Date.now()) / 1000);
      return errorResponse(
        res,
        429,
        `Please wait ${waitSeconds} seconds before requesting a new OTP`,
      );
    }

    const otp = generateOTP();

    // Email update karo + naya OTP bhejo
    user.email = newEmail.toLowerCase().trim();
    user.emailOTP = otp;
    user.emailOTPExpiry = getOTPExpiry(10);
    user.otpResendAt = new Date(Date.now() + 60 * 1000);
    await user.save();

    // Naye email pe OTP bhejo
    await sendEmailUpdateOTP(user.email, user.name, otp);

    return successResponse(
      res,
      200,
      "Email updated! Please check your new email for the OTP",
      {
        email: user.email,
      },
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/auth/me — App startup pe call karo auth check ke liye
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "Authenticated", {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// OAuth Callback (Google + Facebook)
export const oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};
