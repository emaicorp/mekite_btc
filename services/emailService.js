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

  static successIcon = `
    <div style="text-align: center; margin: 2rem 0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#10b981" style="margin: 0 auto;">
        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z"/>
      </svg>
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
        `
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
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Investment Confirmation",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${this.successIcon}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Investment Confirmed!
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${user.fullName},</p>
              <p style="margin-bottom: 1.5rem;">Your investment of $${investment.amount} has been successfully processed.</p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> $${investment.amount}</p>
                <p style="margin: 0.5rem 0;"><strong>Package:</strong> ${investment.selectedPackage}</p>
                <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${investment.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
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

  static async sendReferralCommissionNotification(referrer, commissionData) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: referrer.email,
        subject: "Referral Commission Received",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${this.successIcon}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Referral Commission Received!
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${referrer.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                You have received a referral commission for your referred user's investment.
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Commission Amount:</strong> $${commissionData.amount}</p>
                <p style="margin: 0.5rem 0;"><strong>Referred User:</strong> ${commissionData.referredUser}</p>
                <p style="margin: 0.5rem 0;"><strong>Investment Amount:</strong> $${commissionData.investmentAmount}</p>
                <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p style="margin-top: 1.5rem;">
                The commission has been added to your available balance.
              </p>
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Referral commission email sent to ${referrer.email}`);
    } catch (error) {
      console.error("Email sending error:", error);
    }
  }

  static async sendReferralRegistrationNotification(referrer, data) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: referrer.email,
        subject: "New Referral Registration",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${this.successIcon}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              New Referral Registered!
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${referrer.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                A new user has registered using your referral code!
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Username:</strong> ${data.referredUser.username}</p>
                <p style="margin: 0.5rem 0;"><strong>Full Name:</strong> ${data.referredUser.fullName}</p>
                <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${data.referredUser.email}</p>
                <p style="margin: 0.5rem 0;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p style="margin-top: 1.5rem; color: #059669; font-weight: 600;">
                You will receive a 10% commission on all investments made by this user!
              </p>
              <div style="margin-top: 1rem; padding: 1rem; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #059669;">
                <p style="margin: 0; color: #065f46;">
                  Example: If they invest $1,000, you'll receive $100 as commission.
                </p>
              </div>
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Referral registration notification sent to ${referrer.email}`);
    } catch (error) {
      console.error("Email sending error:", error);
      // Don't throw error to prevent registration process from failing
    }
  }

  static async sendWithdrawalRequestNotification(user, withdrawal) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Withdrawal Request Received",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${this.successIcon}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Withdrawal Request Received
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${user.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                Your withdrawal request has been received and is being processed.
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.currency}</p>
                <p style="margin: 0.5rem 0;"><strong>Wallet:</strong> ${withdrawal.walletAddress}</p>
                <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p style="margin-top: 1.5rem;">
                We will process your request as soon as possible.
              </p>
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
    }
  }

  static async sendWithdrawalApprovalNotification(user, withdrawal) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Withdrawal Request Approved",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            ${this.successIcon}
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Withdrawal Approved!
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${user.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                Your withdrawal request has been approved and processed.
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.currency}</p>
                <p style="margin: 0.5rem 0;"><strong>Wallet:</strong> ${withdrawal.walletAddress}</p>
                <p style="margin: 0.5rem 0;"><strong>Status:</strong> Approved</p>
                <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
    }
  }

  static async sendWithdrawalRejectionNotification(user, withdrawal) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Withdrawal Request Rejected",
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              Withdrawal Request Rejected
            </h2>
            <div style="max-width: 500px; margin: 0 auto;">
              <p style="margin-bottom: 1rem;">Dear ${user.fullName},</p>
              <p style="margin-bottom: 1.5rem;">
                Your withdrawal request has been rejected.
              </p>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.currency}</p>
                <p style="margin: 0.5rem 0;"><strong>Wallet:</strong> ${withdrawal.walletAddress}</p>
                <p style="margin: 0.5rem 0;"><strong>Status:</strong> Rejected</p>
                <p style="margin: 0.5rem 0;"><strong>Reason:</strong> ${withdrawal.remarks || 'No reason provided'}</p>
                <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p style="margin-top: 1.5rem;">
                If you have any questions, please contact support.
              </p>
            </div>
          </div>
          ${this.footer}
        `
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
