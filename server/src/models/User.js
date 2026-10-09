import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "nursery_seller", "buyer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: String(this._id),
    email: this.email,
    name: this.name,
    phone: this.phone,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
