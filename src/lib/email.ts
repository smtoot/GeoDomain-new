import { Resend } from 'resend';

// Email service configuration
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

// Email configuration
export interface EmailConfig {
  from: string;
  replyTo?: string;
  subject: string;
  to: string | string[];
  html: string;
  text?: string;
}

// Email template data interfaces
export interface InquiryNotificationData {
  inquiryId: string;
  domainName: string;
  buyerName: string;
  buyerEmail: string;
  budgetRange: string;
  intendedUse: string;
  message: string;
  inquiryDate: string;
}

export interface MessageNotificationData {
  messageId: string;
  inquiryId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  messageDate: string;
}

export interface PaymentVerificationData {
  dealId: string;
  domainName: string;
  amount: string;
  paymentMethod: string;
  buyerName: string;
  sellerName: string;
  verificationDate: string;
}

export interface DealStatusUpdateData {
  dealId: string;
  domainName: string;
  status: string;
  previousStatus: string;
  updateDate: string;
  notes?: string;
}

// Email sending function
export async function sendEmail(config: EmailConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email will not be sent');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await resend.emails.send({
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      reply_to: config.replyTo,
    });

    if (result.error) {
      console.error('Email sending failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email verification function
export async function sendVerificationEmail(email: string, token: string, name: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to GeoDomainLand!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering with GeoDomainLand. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The GeoDomainLand Team</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: 'Verify Your Email - GeoDomainLand',
    to: email,
    html,
    text: `Welcome to GeoDomainLand! Please verify your email by visiting: ${verificationUrl}`,
  });
}

// Password reset email
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>The GeoDomainLand Team</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: 'Password Reset - GeoDomainLand',
    to: email,
    html,
    text: `Password reset requested. Visit: ${resetUrl}`,
  });
}

// Inquiry notification email (admin)
export async function sendInquiryNotificationEmail(data: InquiryNotificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">New Domain Inquiry</h2>
      <p>A new inquiry has been submitted and requires your review.</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Inquiry Details</h3>
        <p><strong>Domain:</strong> ${data.domainName}</p>
        <p><strong>Buyer:</strong> ${data.buyerName} (${data.buyerEmail})</p>
        <p><strong>Budget Range:</strong> ${data.budgetRange}</p>
        <p><strong>Intended Use:</strong> ${data.intendedUse}</p>
        <p><strong>Message:</strong> ${data.message}</p>
        <p><strong>Submitted:</strong> ${data.inquiryDate}</p>
      </div>
      <p>Please review this inquiry in the admin dashboard.</p>
      <p>Best regards,<br>GeoDomainLand System</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: `New Inquiry: ${data.domainName}`,
    to: process.env.ADMIN_EMAIL || 'admin@geodomainland.com',
    html,
    text: `New inquiry for ${data.domainName} from ${data.buyerName}`,
  });
}

// Message moderation notification (admin)
export async function sendMessageModerationEmail(data: MessageNotificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">New Message Requires Moderation</h2>
      <p>A new message has been submitted and requires your review.</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Message Details</h3>
        <p><strong>From:</strong> ${data.senderName} (${data.senderEmail})</p>
        <p><strong>Inquiry ID:</strong> ${data.inquiryId}</p>
        <p><strong>Content:</strong> ${data.content}</p>
        <p><strong>Submitted:</strong> ${data.messageDate}</p>
      </div>
      <p>Please review this message in the admin dashboard.</p>
      <p>Best regards,<br>GeoDomainLand System</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: 'New Message Requires Moderation',
    to: process.env.ADMIN_EMAIL || 'admin@geodomainland.com',
    html,
    text: `New message from ${data.senderName} requires moderation`,
  });
}

// Payment verification notification (admin)
export async function sendPaymentVerificationEmail(data: PaymentVerificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Payment Verification Required</h2>
      <p>A new payment has been submitted and requires verification.</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Payment Details</h3>
        <p><strong>Deal ID:</strong> ${data.dealId}</p>
        <p><strong>Domain:</strong> ${data.domainName}</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p><strong>Buyer:</strong> ${data.buyerName}</p>
        <p><strong>Seller:</strong> ${data.sellerName}</p>
        <p><strong>Submitted:</strong> ${data.verificationDate}</p>
      </div>
      <p>Please verify this payment in the admin dashboard.</p>
      <p>Best regards,<br>GeoDomainLand System</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: `Payment Verification: ${data.domainName}`,
    to: process.env.ADMIN_EMAIL || 'admin@geodomainland.com',
    html,
    text: `Payment verification required for ${data.domainName}`,
  });
}

// Deal status update notification
export async function sendDealStatusUpdateEmail(data: DealStatusUpdateData, recipientEmail: string, recipientName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Deal Status Updated</h2>
      <p>Hi ${recipientName},</p>
      <p>The status of your deal has been updated.</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Deal Details</h3>
        <p><strong>Domain:</strong> ${data.domainName}</p>
        <p><strong>Previous Status:</strong> ${data.previousStatus}</p>
        <p><strong>New Status:</strong> ${data.status}</p>
        <p><strong>Updated:</strong> ${data.updateDate}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      <p>You can view the updated deal status in your dashboard.</p>
      <p>Best regards,<br>The GeoDomainLand Team</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: `Deal Status Updated: ${data.domainName}`,
    to: recipientEmail,
    html,
    text: `Deal status updated for ${data.domainName} from ${data.previousStatus} to ${data.status}`,
  });
}

// Test email function
export async function sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Test Email</h2>
      <p>This is a test email to verify the email system is working correctly.</p>
      <p>If you received this email, the email configuration is working properly.</p>
      <p>Best regards,<br>GeoDomainLand System</p>
    </div>
  `;

  return sendEmail({
    from: 'noreply@geodomainland.com',
    subject: 'Test Email - GeoDomainLand',
    to,
    html,
    text: 'This is a test email to verify the email system is working correctly.',
  });
}
