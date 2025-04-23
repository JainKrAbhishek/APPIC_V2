import { Resend } from 'resend';
import { storage } from '../storage';

const API_KEY = process.env.RESEND_API_KEY || '';
// Using Resend's recommended onboarding email for testing
const FROM_EMAIL = process.env.FROM_EMAIL || 'Resend <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

interface EmailPayload {
  to: string[] | string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

class EmailService {
  private resend: Resend;

  constructor() {
    // Only initialize Resend if an API key is provided
    if (API_KEY) {
      try {
        this.resend = new Resend(API_KEY);
      } catch (error) {
        console.warn('Failed to initialize Resend:', error);
        this.resend = null as any;
      }
    } else {
      console.warn('Resend API key not provided. Email functionality will be disabled.');
      this.resend = null as any;
    }
  }

  // Method to check if the Resend client is properly initialized
  isConfigured(): boolean {
    return API_KEY !== '' && API_KEY !== undefined && this.resend !== null;
  }

  // Send a generic email
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Resend API key is configured
      if (!this.isConfigured()) {
        console.warn('Resend API key not configured. Email not sent.');
        return { success: false, error: 'Email service not configured' };
      }

      // We're now using Resend's recommended onboarding address which doesn't require verification
      // This check is kept for reference in case custom domains are used in the future
      /*
      if (process.env.NODE_ENV !== 'production' && !FROM_EMAIL.includes('resend.dev')) {
        console.warn('Using unverified domain in development. Email not sent.');
        return { success: false, error: 'Domain not verified in development' };
      }
      */

      const { to, subject, html, text, from = FROM_EMAIL } = payload;

      try {
        const { data, error } = await this.resend.emails.send({
          from,
          to,
          subject,
          html,
          text
        });

        if (error) {
          console.error('Failed to send email:', error);
          
          // Check for domain verification errors
          if (error.message && error.message.includes('domain is not verified')) {
            console.warn('Domain verification error. In production, verify domain on Resend.');
            return { success: false, error: 'Domain verification error' };
          }
          
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (sendError: any) {
        // Handle specific Resend API errors
        if (sendError.statusCode === 403 && 
            sendError.message && 
            sendError.message.includes('domain is not verified')) {
          console.warn('Domain verification error:', sendError.message);
          return { success: false, error: 'Domain verification error' };
        }
        
        throw sendError; // Re-throw for general error handling
      }
    } catch (error) {
      console.error('Exception when sending email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  // Send verification email
  async sendVerificationEmail(
    userId: number, 
    email: string, 
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    const verificationLink = `${APP_URL}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50; text-align: center;">Verify Your Email Address</h2>
        <p>Thank you for signing up for GRE Prep! Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
      </div>
    `;

    const text = `
      Verify Your Email Address
      
      Thank you for signing up for GRE Prep! Please click the link below to verify your email address:
      
      ${verificationLink}
      
      If you didn't create an account with us, you can safely ignore this email.
      
      This link will expire in 24 hours.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - GRE Prep',
      html,
      text
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(
    userId: number, 
    email: string, 
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    const resetLink = `${APP_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50; text-align: center;">Reset Your Password</h2>
        <p>You requested a password reset for your GRE Prep account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
      </div>
    `;

    const text = `
      Reset Your Password
      
      You requested a password reset for your GRE Prep account. Click the link below to set a new password:
      
      ${resetLink}
      
      If you didn't request a password reset, you can safely ignore this email.
      
      This link will expire in 1 hour.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - GRE Prep',
      html,
      text
    });
  }

  // Send welcome email after registration
  async sendWelcomeEmail(
    email: string, 
    firstName: string
  ): Promise<{ success: boolean; error?: string }> {
    const loginLink = `${APP_URL}/login`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to GRE Prep!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining GRE Prep! We're excited to help you prepare for the GRE exam.</p>
        <p>With our platform, you can:</p>
        <ul>
          <li>Practice with thousands of GRE-style questions</li>
          <li>Learn essential vocabulary words</li>
          <li>Master quantitative and verbal concepts</li>
          <li>Track your progress and identify areas for improvement</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Get Started
          </a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Happy studying!</p>
        <p>The GRE Prep Team</p>
      </div>
    `;

    const text = `
      Welcome to GRE Prep!
      
      Hi ${firstName},
      
      Thank you for joining GRE Prep! We're excited to help you prepare for the GRE exam.
      
      With our platform, you can:
      - Practice with thousands of GRE-style questions
      - Learn essential vocabulary words
      - Master quantitative and verbal concepts
      - Track your progress and identify areas for improvement
      
      Get started: ${loginLink}
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Happy studying!
      
      The GRE Prep Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to GRE Prep!',
      html,
      text
    });
  }

  // Send subscription confirmation email
  async sendSubscriptionConfirmationEmail(
    email: string, 
    firstName: string,
    planName: string,
    amount: number,
    interval: string,
    startDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    const accountLink = `${APP_URL}/account`;
    const formattedAmount = (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    const formattedDate = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50; text-align: center;">Subscription Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for subscribing to GRE Prep ${planName} plan!</p>
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #212529;">Subscription Details</h3>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Amount:</strong> ${formattedAmount} per ${interval}</p>
          <p><strong>Start Date:</strong> ${formattedDate}</p>
        </div>
        <p>You now have access to all the premium features included in your subscription plan.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${accountLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Your Account
          </a>
        </div>
        <p>If you have any questions about your subscription, feel free to contact our support team.</p>
        <p>Thank you for choosing GRE Prep!</p>
        <p>The GRE Prep Team</p>
      </div>
    `;

    const text = `
      Subscription Confirmed!
      
      Hi ${firstName},
      
      Thank you for subscribing to GRE Prep ${planName} plan!
      
      Subscription Details:
      Plan: ${planName}
      Amount: ${formattedAmount} per ${interval}
      Start Date: ${formattedDate}
      
      You now have access to all the premium features included in your subscription plan.
      
      View your account: ${accountLink}
      
      If you have any questions about your subscription, feel free to contact our support team.
      
      Thank you for choosing GRE Prep!
      
      The GRE Prep Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your GRE Prep Subscription Confirmation',
      html,
      text
    });
  }
}

// Singleton instance
export const emailService = new EmailService();