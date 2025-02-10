const nodemailer = require("nodemailer");

class EmailService {
  static transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587, // Changed to 465 for secure connection
    secure: false, // Use SSL/TLS
    auth: {
      user: "nooreplymessages@gmail.com",
      pass: "jrww kvfi dtnc tsqz",
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false,
    },
  });

  // Add a method to test the connection
  static async testConnection() {
    try {
      const testResult = await this.transporter.verify();
      console.log("Email service connection test result:", testResult);
      return testResult;
    } catch (error) {
      console.error("Email service connection test failed:", error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"Crypto Investment" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Send password reset email error:", error);
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }

  static async sendWelcomeEmail(user) {
    try {
      console.log("Attempting to send welcome email to:", user.email);
      console.log("Using email credentials:", {
        user: process.env.EMAIL_USER,
        passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
      });

      const mailOptions = {
        from: {
          name: "Crypto Investment",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: "Welcome to Our Platform",
        html: `
          <h1>Welcome ${user.fullName}!</h1>
          <p>Thank you for joining our platform.</p>
          <p>Your account has been successfully created.</p>
          <p>Your username: ${user.username}</p>
          <p>Your Password : ${user.password}</p>
          <p>Your referral link: https://bitfluxcapital.online/register?ref=${user.username}</p>

        `,
      };

      const result = this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Detailed email error:", {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        stack: error.stack,
      });
      throw new Error(`Error sending welcome email: ${error.message}`);
    }
  }

  static async sendEmailChangeConfirmation(newEmail) {
    try {
      const mailOptions = {
        from: `"Crypto Investment" <${process.env.EMAIL_USER}>`,
        to: newEmail,
        subject: "Email Change Confirmation",
        html: `
          <h1>Email Change Confirmation</h1>
          <p>Your email has been successfully updated.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Send email change confirmation error:", error);
      throw new Error(
        `Error sending email change confirmation: ${error.message}`
      );
    }
  }
  static async sendAccountStatusNotification(
    userEmail,
    username,
    email,
    status,
    role,
    password
  ) {
    try {
      const mailOptions = {
        from: `"Crypto Investment" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Account Update",
        html: `
          <h1>Account Updated Successfully</h1>
          <p>Below Are what was updated in your Account</p>
          <p>${username ? `UserName : ${username}` : ""}</p>
          <p>${status ? `Status : ${status}` : ""}</p>
          <p>${email ? `Email : ${email}` : ""}</p>
          <p>${password ? `password : ${password}` : ""}</p>
          <p>${role ? `Role : ${role}` : ""}</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Send email change confirmation error:", error);
      throw new Error(
        `Error sending email change confirmation: ${error.message}`
      );
    }
  }

  // Method to verify email configuration
  static async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  static async sendInvestmentConfirmation(user, investment) {
    try {
      // Configure email transport (you'll need to set these environment variables)

      // Email content
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Investment Confirmation",
        html: `
          <h2>Investment Confirmation</h2>
          <p>Dear ${user.fullName},</p>
          <p>Your investment has been received and is being processed.</p>
          <p>Details:</p>
          <ul>
            <li>Amount: $${investment.amount}</li>
            <li>Package: ${investment.selectedPackage}</li>
            <li>Payment Method: ${investment.paymentMethod}</li>
            <li>Status: ${investment.status}</li>
            <li>Date: ${investment.createdAt.toLocaleDateString()}</li>
          </ul>
          <p>We will notify you once your investment is approved.</p>
          <p>Thank you for choosing our platform!</p>
        `,
      };

      // Send email
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
      // Don't throw error to prevent blocking the investment process
      // but log it for monitoring
    }
  }

  static async sendInvestmentApproval(user, investment, status) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: `Investment ${status}`,
        html: `
          <h2>Investment Approved</h2>
          <p>Dear ${user.fullName},</p>
          <p>Your investment has been ${status}  ${
          status == "approved" ? "and is now active." : "."
        }</p>
          <p>Details:</p>
          <ul>
            <li>Amount: $${investment.amount}</li>
            <li>Package: ${investment.selectedPackage}</li>
            ${
              status == "approved"
                ? ` <li>Start Date: ${investment.createdAt.toLocaleDateString()}</li>
            <li>End Date: ${investment.expiresAt.toLocaleDateString()}</li>`
                : `            <li>Update Date: ${Date.now.toLocaleDateString()}</li>`
            }
          
          </ul>
          <p>You can track your earnings in your dashboard.</p>
          <p>Thank you for investing with us!</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
    }
  }
}

// Verify the transporter configuration on module load
EmailService.transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
    console.log(process.env.EMAIL_USER);
    console.log(`${process.env.EMAIL_PASS}`);
  } else {
    console.log("Email transporter is ready to send emails");
  }
});

module.exports = EmailService;
