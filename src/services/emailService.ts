import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendResetPasswordEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"QuizApp Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Verification Code',
    text: `Your password reset verification code is: ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your QuizApp account. Please use the following 6-digit verification code to proceed:</p>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">QuizApp Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error('Detailed SMTP Error:', error);
    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }
    throw new Error('Failed to send reset email');
  }
};
