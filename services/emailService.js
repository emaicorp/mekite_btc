const nodemailer = require("nodemailer");

class EmailService {
  static transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
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

  // Shared template components
  static header = `
    <div style="
      background: linear-gradient(45deg, #6366f1, #3b82f6);
      color: white;
      padding: 1.5rem;
      text-align: center;
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: bold;
      letter-spacing: 1px;
    ">
      bitfluxcapital
    </div>
  `;

  static footer = `
    <div style="
      margin-top: 2rem;
      padding: 1rem;
      text-align: center;
      color: #6b7280;
      font-family: 'Poppins', sans-serif;
    ">
      © ${new Date().getFullYear()} bitfluxcapital. All rights reserved.
    </div>
  `;

  // Add your base64-encoded images for the icons here
  static successIconBase64 = `
    <div style="text-align: center; margin: 2rem 0;">
      <img src="data:image/png;base64,PUT_YOUR_SUCCESS_ICON_BASE64_HERE" alt="Success Icon" width="64" height="64" />
    </div>
  `;

  static withdrawalIconBase64 = `
    <div style="text-align: center; margin: 2rem 0;">
      <img src="data:image/png;base64,PUT_YOUR_WITHDRAWAL_ICON_BASE64_HERE" alt="Withdrawal Approved Icon" width="64" height="64" />
    </div>
  `;

  // Add to the top of your EmailService class
  static emailStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
    </style>
  `;

  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"bitfluxcapital" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            <div style="max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
                Password Reset Request
              </h2>
              <p style="margin-bottom: 1rem;">We received a request to reset your password. Click the button below to proceed:</p>
              <a href="${resetLink}" style="
                display: block;
                width: 200px;
                margin: 1.5rem auto;
                padding: 12px 24px;
                background: #4f46e5;
                color: white;
                text-align: center;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              ">
                Reset Password
              </a>
              <p style="color: #6b7280; font-size: 0.875rem;">
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
          ${this.footer}
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
      const mailOptions = {
        from: {
          name: "Crypto Investment",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: "Welcome to Our Platform",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            <h1>Welcome ${user.fullName}!</h1>
            <p>Thank you for joining our platform.</p>
            <p>Your account has been successfully created.</p>
            <p>Your username: ${user.username}</p>
            <p>Your Password: ${user.password}</p>
            <p>Your referral link: https://bitfluxcapital.online/register?ref=${user.username}</p>
          </div>
          ${this.footer}
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw new Error(`Error sending welcome email: ${error.message}`);
    }
  }

  static async sendInvestmentApproval(user, investment, status) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: `Investment ${status}`,
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${status === "approved" ? this.successIconBase64 : this.withdrawalIconBase64}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Investment ${status.charAt(0).toUpperCase() + status.slice(1)}
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${user.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                Your investment of $${investment.amount} has been successfully ${status}.
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> $${investment.amount}</p>
                <p style="margin: 0.5rem 0;"><strong>Package:</strong> ${investment.selectedPackage}</p>
                ${
                  status === "approved"
                    ? `<p style="margin: 0.5rem 0;"><strong>Start Date:</strong> ${investment.createdAt.toLocaleDateString()}</p>
                       <p style="margin: 0.5rem 0;"><strong>End Date:</strong> ${investment.expiresAt.toLocaleDateString()}</p>`
                    : `<p style="margin: 0.5rem 0;"><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>`
                }
              </div>
            </div>
          </div>
          ${this.footer}
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
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
}

// Verify the transporter configuration on module load
EmailService.transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email transporter is ready to send emails");
  }
});

module.exports = EmailService;
