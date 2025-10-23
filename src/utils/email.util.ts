import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;  // Optional for HTML emails
}

export async function sendEmail(options: SendEmailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Or 'hotmail', 'yahoo', etc.; for custom SMTP, use host/port instead
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}: ${options.subject}`);  // For logging; replace with your logger if needed
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');  // Or handle gracefully in your service
  }
}