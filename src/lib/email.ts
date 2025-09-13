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

// Support ticket email data interfaces
export interface SupportTicketCreatedData {
  ticketId: string;
  title: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  description: string;
  createdAt: string;
  ticketUrl: string;
}

export interface SupportTicketUpdateData {
  ticketId: string;
  title: string;
  status: string;
  previousStatus: string;
  userName: string;
  userEmail: string;
  updateDate: string;
  message?: string;
  ticketUrl: string;
}

export interface SupportTicketAssignedData {
  ticketId: string;
  title: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  adminName: string;
  assignedDate: string;
  ticketUrl: string;
}

export interface SupportTicketAdminAlertData {
  ticketId: string;
  title: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  description: string;
  createdAt: string;
  ticketUrl: string;
}

// Email sending function
export async function sendEmail(config: EmailConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
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
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
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

// Support ticket email functions

// Support ticket created confirmation (user)
export async function sendSupportTicketCreatedEmail(data: SupportTicketCreatedData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Support Ticket Created</h2>
      <p>Hi ${data.userName},</p>
      <p>Your support ticket has been successfully created and our team will review it shortly.</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Ticket Details</h3>
        <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Category:</strong> ${data.category.replace(/_/g, ' ')}</p>
        <p><strong>Priority:</strong> ${data.priority}</p>
        <p><strong>Created:</strong> ${data.createdAt}</p>
        <p><strong>Description:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid #2563eb;">${data.description}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.ticketUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
      </div>
      
      <p>We'll get back to you as soon as possible. You can track the progress of your ticket using the link above.</p>
      <p>Best regards,<br>GeoDomainLand Support Team</p>
    </div>
  `;

  return sendEmail({
    from: 'support@geodomainland.com',
    subject: `Support Ticket Created - ${data.ticketId}`,
    to: data.userEmail,
    html,
    text: `Your support ticket has been created. Ticket ID: ${data.ticketId}. View at: ${data.ticketUrl}`,
  });
}

// Support ticket admin alert
export async function sendSupportTicketAdminAlertEmail(data: SupportTicketAdminAlertData, adminEmail: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const priorityColor = data.priority === 'URGENT' ? '#dc2626' : data.priority === 'HIGH' ? '#ea580c' : data.priority === 'MEDIUM' ? '#d97706' : '#059669';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${priorityColor};">New Support Ticket - ${data.priority} Priority</h2>
      <p>A new support ticket has been submitted and requires attention.</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Ticket Details</h3>
        <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Category:</strong> ${data.category.replace(/_/g, ' ')}</p>
        <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${data.priority}</span></p>
        <p><strong>User:</strong> ${data.userName} (${data.userEmail})</p>
        <p><strong>Created:</strong> ${data.createdAt}</p>
        <p><strong>Description:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid ${priorityColor};">${data.description}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.ticketUrl}" style="background-color: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Ticket</a>
      </div>
      
      <p>Please review and respond to this ticket as soon as possible.</p>
      <p>Best regards,<br>GeoDomainLand System</p>
    </div>
  `;

  return sendEmail({
    from: 'support@geodomainland.com',
    subject: `[${data.priority}] New Support Ticket - ${data.ticketId}`,
    to: adminEmail,
    html,
    text: `New support ticket: ${data.ticketId} - ${data.title} (${data.priority} priority). Review at: ${data.ticketUrl}`,
  });
}

// Support ticket status update (user)
export async function sendSupportTicketUpdateEmail(data: SupportTicketUpdateData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const statusColor = data.status === 'RESOLVED' ? '#059669' : data.status === 'CLOSED' ? '#6b7280' : '#2563eb';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColor};">Support Ticket Updated</h2>
      <p>Hi ${data.userName},</p>
      <p>Your support ticket status has been updated.</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Update Details</h3>
        <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${data.status}</span></p>
        <p><strong>Previous Status:</strong> ${data.previousStatus}</p>
        <p><strong>Updated:</strong> ${data.updateDate}</p>
        ${data.message ? `<p><strong>Message:</strong></p><p style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid ${statusColor};">${data.message}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.ticketUrl}" style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
      </div>
      
      <p>Thank you for your patience. If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>GeoDomainLand Support Team</p>
    </div>
  `;

  return sendEmail({
    from: 'support@geodomainland.com',
    subject: `Support Ticket Updated - ${data.ticketId}`,
    to: data.userEmail,
    html,
    text: `Your support ticket ${data.ticketId} status has been updated to ${data.status}. View at: ${data.ticketUrl}`,
  });
}

// Support ticket assignment notification (user)
export async function sendSupportTicketAssignedEmail(data: SupportTicketAssignedData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Support Ticket Assigned</h2>
      <p>Hi ${data.userName},</p>
      <p>Your support ticket has been assigned to one of our support specialists.</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Assignment Details</h3>
        <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Category:</strong> ${data.category.replace(/_/g, ' ')}</p>
        <p><strong>Priority:</strong> ${data.priority}</p>
        <p><strong>Assigned to:</strong> ${data.adminName}</p>
        <p><strong>Assigned:</strong> ${data.assignedDate}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.ticketUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
      </div>
      
      <p>Your assigned support specialist will review your ticket and respond as soon as possible.</p>
      <p>Best regards,<br>GeoDomainLand Support Team</p>
    </div>
  `;

  return sendEmail({
    from: 'support@geodomainland.com',
    subject: `Support Ticket Assigned - ${data.ticketId}`,
    to: data.userEmail,
    html,
    text: `Your support ticket ${data.ticketId} has been assigned to ${data.adminName}. View at: ${data.ticketUrl}`,
  });
}
