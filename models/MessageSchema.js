const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now } // Automatically store when the message is sent
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
