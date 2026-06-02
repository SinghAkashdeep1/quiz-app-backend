import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testSmtp = async () => {
  console.log('Testing SMTP connection with:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Secure:', process.env.SMTP_SECURE);

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

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('SMTP connection successful!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"QuizApp Test" <${process.env.SMTP_USER}>`,
      to: 'akashdeep@seasiaconnect.com', // Trying to send to user's email if possible, or a placeholder
      subject: 'SMTP Test Email',
      text: 'If you receive this, SMTP is working correctly.',
      html: '<b>If you receive this, SMTP is working correctly.</b>',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('SMTP Error:', error);
  }
};

testSmtp();
