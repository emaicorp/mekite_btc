const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const sendEmail = require('../emailUtils'); // Importing the email sending utility

router.post("/send", async (req, res) => {
    const { firstName, lastName, phone, email, message } = req.body;
  
    try {
      const newMessage = new Message({
        firstName,
        lastName,
        phone,
        email,
        message,
      });
  
      await newMessage.save();
  
      // Send a confirmation email to the user
      const subject = "Message Received";
      const text = `Hello ${firstName},\n\nWe have received your message: "${message}". Our team will get back to you soon.`;
      const html = `<p>Hello ${firstName},</p><p>We have received your message: <strong>"${message}"</strong>.</p><p>Our team will get back to you soon.</p>`;
      await sendEmail(email, subject, text, html);
  
      res.status(201).json({ message: "Message sent successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message." });
    }
  });

  // Admin views all messages
router.get("/messages", async (req, res) => {
    try {
      // Fetch all messages that have not yet been responded to
      const messages = await Message.find({ status: "pending" }).sort({ createdAt: -1 });
  
      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch messages." });
    }
  });
  
  router.post("/messages/reply/:messageId", async (req, res) => {
    const { messageId } = req.params;
    const { response } = req.body;
  
    try {
      // Find the message by ID
      const message = await Message.findById(messageId);
  
      if (!message) {
        return res.status(404).json({ error: "Message not found." });
      }
  
      // Update the message with the admin's response
      message.response = response;
      message.respondedAt = Date.now();
      message.status = "responded"; // Mark message as responded
      await message.save();
  
      // Send an email to the user with the admin's reply
      const subject = "Response from Admin";
      const text = `Hello ${message.firstName},\n\nOur team has replied to your message: "${response}".`;
      const html = `<p>Hello ${message.firstName},</p><p>Our team has replied to your message: <strong>"${response}"</strong>.</p>`;
      await sendEmail(message.email, subject, text, html);
  
      res.status(200).json({ message: "Reply sent successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send reply." });
    }
  });
  
module.exports = router;
