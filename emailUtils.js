const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = (to, subject, text, html) => {
  return new Promise((resolve, reject) => {
    // Ensure you have the email user and password in your environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Replace with your email user
        pass: process.env.EMAIL_PASS, // Replace with your email password (or app password)
      },
    });

    const mailOptions = {
      from: `"Central National Bank" <${process.env.EMAIL_USER}>`, // Sender address
      to, // Receiver address
      subject, // Subject line
      text, // Plaintext body
      html, // HTML body
    };

    console.log('Sending email to:', to);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
      } else {
        console.log('Email sent successfully:', info.response);
        resolve(info.response);
      }
    });
  });
};

module.exports = sendEmail;
