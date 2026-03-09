import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ─── Saved Address Schema (Google Maps se aayega) ─
const savedAddressSchema = new mongoose.Schema(
  {
    formatted: { type: String }, // "Model Town, Lahore, Punjab, Pakistan"
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    lat: { type: Number }, // For delivery tracking
    lng: { type: Number },
    placeId: { type: String }, // Google's unique Place ID
  },
  { _id: false },
); // No need for a separate ID

const userSchema = new mongoose.Schema(
  {
    // ─── Basic Info ─────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },

    // ─── OAuth ──────────────────────────────────
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },

    // ─── Email Verification ──────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: { type: String, select: false },
    emailOTPExpiry: { type: Date, select: false },
    otpResendAt: { type: Date },

    // ─── Password Reset ──────────────────────────
    passwordResetOTP: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // ─── Security ────────────────────────────────
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },

    // ─── Saved Address (Google Maps) ─────────────
    // Single address — verified via Google Maps API
    // Automatically populated at checkout; no manual typing required
    savedAddress: {
      type: savedAddressSchema,
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Password Hash ───────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Password Compare ────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Account Lock Check ──────────────────────────
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// ─── Safe Object  ──────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailOTP;
  delete obj.emailOTPExpiry;
  delete obj.passwordResetOTP;
  delete obj.passwordResetExpiry;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

export default mongoose.model("User", userSchema);
