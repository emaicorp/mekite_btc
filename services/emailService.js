const nodemailer = require('nodemailer');

class EmailService {
  static transporter = nodemailer.createTransport({
    // Configure your email service here
    // Example for Gmail:
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }

  static async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Welcome to Our Platform',
        html: `
          <h1>Welcome ${user.fullName}!</h1>
          <p>Thank you for joining our platform.</p>
          <p>Your account has been successfully created.</p>
          <p>Your username: ${user.username}</p>
          <p>Your referral link: ${user.referralLink}</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Error sending welcome email: ${error.message}`);
    }
  }

  static async sendEmailChangeConfirmation(newEmail) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newEmail,
        subject: 'Email Change Confirmation',
        html: `
          <h1>Email Change Confirmation</h1>
          <p>Your email has been successfully updated.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Error sending email change confirmation: ${error.message}`);
    }
  }
}

module.exports = EmailService; 