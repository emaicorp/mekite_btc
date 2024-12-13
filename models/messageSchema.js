const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  message: String,
  adminResponse: { type: String, required: false },  // Admin's response
  respondedAt: { type: Date, required: false },      // Timestamp of the response
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
