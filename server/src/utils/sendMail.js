const config = require("../config/config.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: config.GMAIL_USER,
    pass: config.GMAIL_PASS,
  },
});

const generateUnlockAccountHTML = (
  name,
  unlockAccountLink,
  lockUntil
) => {
  return `
        <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafb;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .email-header {
          background-color: #FF6F61;
          color: #ffffff;
          text-align: center;
          padding: 20px;
        }
        .email-header h1 {
          margin: 0;
          font-size: 24px;
        }
        .email-body {
          padding: 20px;
          color: #333333;
          line-height: 1.6;
        }
        .email-body p {
          margin: 0 0 15px;
        }
        .email-footer {
          text-align: center;
          padding: 20px;
          background-color: #f8fafb;
          font-size: 12px;
          color: #777777;
        }
        .unlock-button-container {
          text-align: center;
          margin: 20px 0;
        }
        .unlock-button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #ffffff;
          color: #FF6F61;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          border: 2px solid #FF6F61;
        }
        .unlock-button:hover {
          background-color: #FF6F61;
          color: #ffffff;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Unlock Your Account</h1>
        </div>
        <div class="email-body">
          <p>Hi ${name},</p>
          <p>We noticed that your account has been locked due to multiple unsuccessful login attempts. Your account will remain locked until <strong>${lockUntil}</strong>. To regain access sooner, please click the button below to unlock your account:</p>
          <div class="unlock-button-container">
            <a href="${unlockAccountLink}" class="unlock-button">Unlock Account</a>
          </div>
          <p>If you did not attempt to log in, please contact our support team immediately.</p>
          <p>Thank you, The TripCast Team</p>
        </div>
        <div class="email-footer">
          <p>&copy; ${new Date().getFullYear()} TripCast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
        `;
};

exports.sendUnlockAccountEmail = async (
  recipientEmail,
  name,
  unlockTime,
  unlockAccountLink
) => {
  try {
    console.log(`Sending unlock account email to: ${recipientEmail}`);
    
    const htmlContent = generateUnlockAccountHTML(
      name,
      unlockAccountLink,
      unlockTime
    );

    const mailOptions = {
      from: `"TripCast Security" <${config.GMAIL_USER}>`,
      to: recipientEmail,
      subject: "Account Locked - Action Required",
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Unlock account email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending unlock account email:", error);
    throw error;
  }
};

exports.sendVerificationEmail = async (
  toEmail,
  userFullName,
  verificationLink
) => {
  try {
    await transporter.sendMail({
      from: `"TripCast" <${config.GMAIL_USER}>`,
      to: toEmail,
      subject: "Verify Your Email Address",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f8fafb; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background-color: #FF6F61; padding: 20px; color: white; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Welcome to TripCast, ${userFullName}!</h2>
        </div>
        
        <!-- Body Section -->
        <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Thank you for joining the TripCast community! You’re just one step away from exploring exciting destinations and connecting with fellow travelers.</p>
            <p style="font-size: 16px;">
                To complete your registration, please verify your email address by clicking the button below:
            </p>

            <!-- Button Section -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" target="_blank"
                   style="background-color: #FF6F61; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                   Verify Email Address
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
                If you did not create an account, you can safely ignore this email.
            </p>
        </div>
        
        <div style="background-color: #f8fafb; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} TripCast. All rights reserved.
        </div>
    </div>
</div>
`,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

exports.sendForgotPasswordEmail = async (
  toEmail,
  userFullName,
  resetLink
) => {
  try {
    await transporter.sendMail({
      from: `"TripCast" <${config.GMAIL_USER}>`,
      to: toEmail,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafb; padding: 40px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header Section -->
            <div style="background-color: #FF6F61; padding: 20px; color: white; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0; font-size: 24px;">Password Reset Request, ${userFullName}!</h2>
            </div>
            
            <!-- Body Section -->
            <div style="padding: 30px; color: #333;">
              <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password. No worries, just click the button below to create a new one.</p>
              <p style="font-size: 16px; line-height: 1.6;">To reset your password, click the button below:</p>

              <!-- Button Section -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" target="_blank"
                   style="background-color: #FF6F61; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                   Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666; text-align: center; line-height: 1.6;">
                If you didn’t request a password reset, please ignore this email.
              </p>
            </div>
            
            <!-- Footer Section -->
            <div style="background-color: #f8fafb; padding: 20px; text-align: center; font-size: 12px; color: #999; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              &copy; ${new Date().getFullYear()} TripCast. All rights reserved.
            </div>
          </div>
        </div>`
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
