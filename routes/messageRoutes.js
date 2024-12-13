const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');

// Endpoint for users to send a message
router.post('/send', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, message } = req.body;

    if (!firstName || !lastName || !phone || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newMessage = new Message({
      firstName,
      lastName,
      phone,
      email,
      message,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Endpoint for admin to get all messages
router.get('/admin/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// Endpoint for admin to respond to a message
router.post('/admin/respond/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response message is required.' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    message.adminResponse = response;
    message.respondedAt = new Date();
    await message.save();

    res.status(200).json({ message: 'Response sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send response.' });
  }
});

module.exports = router;
