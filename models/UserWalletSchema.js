const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  bitcoinAddress: { type: String, default: null },
  ethereumAddress: { type: String, default: null },
  usdtAddress: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Wallet", WalletSchema);
