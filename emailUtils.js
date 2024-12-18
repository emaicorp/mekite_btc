const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = (to, subject, text, html) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: `"BIT FLUX CAPITAL" <${process.env.EMAIL_USER}>`, // Correctly formatted 'from' field
      to,
      subject,
      text,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error.message); // Log the error message
        reject(error); // Reject with the error
      } else {
        console.log("Email sent successfully:", info.response); // Log the response
        resolve(info.response); // Resolve with the response
      }
    });
  });
};

module.exports = sendEmail;
