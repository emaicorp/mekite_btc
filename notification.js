// utils/notification.js
const nodemailer = require('nodemailer');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service provider like 'gmail', 'outlook', etc.
  auth: {
    user: process.env.EMAIL_USER, // Set this environment variable for the sender email
    pass: process.env.EMAIL_PASS, // Set this environment variable for the email password or app password
  },
});

// Function to send the referral message
const sendReferralMessage = (referrer, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender email address
    to: referrer.email, // Receiver's email (the referrer's email)
    subject: 'Referral Link Clicked - Commission Earned',
    text: message, // The body of the email message
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Referral email sent:', info.response);
    }
  });
};

module.exports = { sendReferralMessage };
