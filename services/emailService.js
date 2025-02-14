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
  <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 2rem auto;">
  <tr>
    <td align="center">
      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiPjwhLS0gQ2lyY2xlIC0tPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ1IiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIvPjwhLS0gQ2hlY2ttYXJrIC0tPjxwb2x5bGluZSBwb2ludHM9IjMwLDU1IDQ1LDcwIDcwLDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iNSIvPjwvc3ZnPg==" width="64" height="64" alt="Success Icon" />
    </td>
  </tr>
</table>

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

      await this.transporter.sendMail(mailOptions);

      // Add admin notification
      await this.sendAdminNotification(
        'New User Registration',
        `<p>A new user has registered on the platform.</p>`,
        {
          details: {
            'Full Name': user.fullName,
            'Email': user.email,
            'Username': user.username,
            'Registration Date': new Date().toLocaleDateString(),
            'Referral Code': user.referralCode || 'None'
          }
        }
      );
    } catch (error) {
      console.error("Email sending error:", error);
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

      // Add admin notification
      await this.sendAdminNotification(
        'Account Status Updated',
        `<p>A user account has been updated.</p>`,
        {
          details: {
            'User Email': userEmail,
            'Username': username || 'No change',
            'New Email': email || 'No change',
            'New Status': status || 'No change',
            'New Role': role || 'No change',
            'Password Changed': password ? 'Yes' : 'No',
            'Update Date': new Date().toLocaleDateString()
          }
        }
      );
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

      // Add admin notification
      await this.sendAdminNotification(
        'New Investment Created',
        `<p>A new investment has been created on the platform.</p>`,
        {
          details: {
            'Investor': `${user.fullName} (${user.email})`,
            'Amount': `$${investment.amount}`,
            'Package': investment.selectedPackage,
            'Payment Method': investment.paymentMethod,
            'Transaction Date': new Date().toLocaleDateString()
          }
        }
      );
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

      // Add admin notification
      await this.sendAdminNotification(
        'Referral Commission Paid',
        `<p>A referral commission has been paid out.</p>`,
        {
          details: {
            'Referrer': `${referrer.fullName} (${referrer.email})`,
            'Referred User': commissionData.referredUser,
            'Commission Amount': `$${commissionData.amount}`,
            'Investment Amount': `$${commissionData.investmentAmount}`,
            'Date': new Date().toLocaleDateString()
          }
        }
      );
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

      // Add admin notification
      await this.sendAdminNotification(
        'New Withdrawal Request',
        `<p>A new withdrawal request has been submitted and requires your approval.</p>`,
        {
          details: {
            'User': `${user.fullName} (${user.email})`,
            'Amount': `${withdrawal.amount} ${withdrawal.currency}`,
            'Wallet Address': withdrawal.walletAddress,
            'Request Date': new Date().toLocaleDateString(),
            'Current Balance': `$${user.availableBalance}`
          }
        }
      );
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

  static async getAdminEmails() {
    try {
      const AdminEmail = require('../models/AdminEmail');
      const activeEmails = await AdminEmail.find({ isActive: true }).select('email');
      return activeEmails.map(email => email.email);
    } catch (error) {
      console.error('Error fetching admin emails:', error);
      return [];
    }
  }

  static async sendAdminNotification(subject, content, data = {}) {
    try {
      const adminEmails = await this.getAdminEmails();
      console.log("adminEmails", adminEmails)
      
      if (!adminEmails.length) {
        console.warn('No active admin emails found');
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: adminEmails,
        subject: subject,
        html: `
          ${this.emailStyles}
          ${this.header}
          <div style="padding: 2rem; font-family: 'Poppins', sans-serif;">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 1.5rem;">
              ${subject}
            </h2>
            <div style="max-width: 600px; margin: 0 auto;">
              ${content}
              ${data.details ? `
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-top: 1.5rem;">
                  ${Object.entries(data.details).map(([key, value]) => `
                    <p style="margin: 0.5rem 0;"><strong>${key}:</strong> ${value}</p>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          ${this.footer}
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Admin notification sent to ${adminEmails.length} recipients`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
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
