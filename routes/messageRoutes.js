const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const sendEmail = require('../emailUtils'); // Importing the email sending utility

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

router.post('/admin/respond/:id', async (req, res) => {
    try {
      // Extract message ID from URL parameters and response from the request body
      const { id } = req.params;
      const { response } = req.body;
  
      // Check if a response is provided
      if (!response) {
        return res.status(400).json({ error: 'Response message is required.' });
      }
  
      // Find the message by its ID in the database
      const message = await Message.findById(id);
      
      // If message is not found, return an error
      if (!message) {
        return res.status(404).json({ error: 'Message not found.' });
      }
  
      // Save the admin's response and timestamp
      message.adminResponse = response;
      message.respondedAt = new Date(); // Record the date/time of the response
      await message.save();
  
      // Prepare the email content to notify the user
      const userEmail = message.email; // The user's email stored in the message
      const subject = 'Your Message Response from Bitfluxcapital';
      const text = `Dear ${message.firstName} ${message.lastName},\n\n` +
                   `We have responded to your message. Here is the response:\n\n` +
                   `${response}\n\nBest regards,\nCentral National Bank`;
      const html = `<p>Dear ${message.firstName} ${message.lastName},</p>` +
                   `<p>We have responded to your message. Here is the response:</p>` +
                   `<blockquote>${response}</blockquote>` +
                   `<p>Best regards,<br>Central National Bank</p>`;
  
      // Send the email to the user
      await sendEmail(userEmail, subject, text, html);
  
      // Respond with a success message
      res.status(200).json({ message: 'Response sent successfully and email notification sent.' });
  
    } catch (error) {
      // Handle any errors that occur during the process
      console.error('Error sending response and email:', error);
      res.status(500).json({ error: 'Failed to send response and email.' });
    }
  });

module.exports = router;
