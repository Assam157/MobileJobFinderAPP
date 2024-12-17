const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    otp1: { type: Number, required: true },
    expiresAt1: { type: Date, required: true }, // Expiration time for OTP
});

const OtpModel = mongoose.model('Otp', otpSchema);

module.exports = OtpModel;
