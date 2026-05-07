const nodemailer = require('nodemailer');
require('dotenv').config();

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

async function testConnection() {
  console.log('Testing SMTP connection with settings:');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Success: Connection has been established successfully');

    const mailOptions = {
      from: `"QuizApp Support" <${process.env.SMTP_USER}>`,
      to: 'akash.deep@yopmail.com',
      subject: 'SMTP Test',
      text: 'This is a test email.',
    };

    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Success: Email sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection();
