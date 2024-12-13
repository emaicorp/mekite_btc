const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  response: { type: String, default: "" }, // Admin's reply to the user's message
  respondedAt: { type: Date, default: null }, // Timestamp for when the admin responded
  status: {
    type: String,
    enum: ["pending", "responded"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
