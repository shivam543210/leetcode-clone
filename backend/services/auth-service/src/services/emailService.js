const nodemailer = require('nodemailer');
const config = require('../../../shared/config');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    if (config.services.email.sendgrid.apiKey) {
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: config.services.email.sendgrid.apiKey
        }
      });
    } else {
      // Development SMTP (use Ethereal for testing)
      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
  }

  async sendEmail({ to, subject, text, html }) {
    const mailOptions = {
      from: config.services.email.sendgrid.fromEmail || 'noreply@leetcode-clone.com',
      to,
      subject,
      text,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(user, token) {
    const verificationLink = `${config.app.frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to LeetCode Clone!</h2>
        <p>Hi ${user.profile.firstName || user.username},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - LeetCode Clone',
      html
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetLink = `${config.app.frontendUrl}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.profile.firstName || user.username},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetLink}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset - LeetCode Clone',
      html
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to LeetCode Clone! 🎉</h2>
        <p>Hi ${user.profile.firstName || user.username},</p>
        <p>Your email has been verified and your account is now active!</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Start solving coding problems</li>
          <li>Join coding contests</li>
          <li>Track your progress</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.app.frontendUrl}/dashboard" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>Happy coding!</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to LeetCode Clone! 🚀',
      html
    });
  }
}

module.exports = new EmailService();
