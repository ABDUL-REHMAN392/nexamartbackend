import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const savedAddressSchema = new mongoose.Schema(
  {
    formatted: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    placeId: { type: String },
  },
  { _id: false },
);

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

    // ─── Email Verified ──────────────────────────
    isEmailVerified: { type: Boolean, default: false },

    // ─── Security ────────────────────────────────
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },

    // ─── Saved Address ────────────────────────────
    savedAddress: { type: savedAddressSchema, default: null },
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

// ─── Safe Object ─────────────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

export default mongoose.model("User", userSchema);
