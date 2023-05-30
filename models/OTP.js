const mongoose = require("mongoose");

const otpSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
    match: [/^09\d{9}$/, "is invalid"],
  },
  code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    expires: "1m",
    default: Date.now(),
  },
});

const Otp = mongoose.models.OTP || mongoose.model("Otp", otpSchema);

module.exports = {
  newOTP: async (phone, code) => {
    return await Otp.create({ phone, code });
  },
  verifyOTP: async (phone, code) => {
    return await Otp.findOneAndUpdate({ phone, code }, { status: "VERIFIED" });
  },
};
