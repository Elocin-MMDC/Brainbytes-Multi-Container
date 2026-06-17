const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
});

/**
 * Send email verification link to the user
 * @param {string} toEmail - recipient email
 * @param {string} token - verification token
 */
const sendVerificationEmail = async (toEmail, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"BrainBytes" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your BrainBytes account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Welcome to BrainBytes! 🧠</h2>
        <p>Hi there! Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
          style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                 background-color: #4f46e5; color: white; border-radius: 6px;
                 text-decoration: none; font-weight: bold;">
          Verify My Email
        </a>
        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          This link expires in <strong>24 hours</strong>. If you didn't create an account, you can ignore this email.
        </p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #9ca3af; font-size: 12px;">BrainBytes — AI Tutoring for Filipino Students</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };