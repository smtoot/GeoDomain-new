# 📧 Email & Notification System Setup Guide

## **Overview**
This guide will help you set up the comprehensive email and notification system for GeoDomainLand, including email sending, user notifications, and admin alerts.

---

## **🚀 Quick Start**

### **1. Install Dependencies**
```bash
npm install resend zustand date-fns
```

### **2. Environment Configuration**
Add these variables to your `.env.local`:

```bash
# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
ADMIN_EMAIL=admin@geodomainland.com
EMAIL_FROM=noreply@geodomainland.com
EMAIL_REPLY_TO=support@geodomainland.com

# Notification Settings
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_PUSH_ENABLED=false
NOTIFICATION_IN_APP_ENABLED=true
```

---

## **📧 Email Service Setup**

### **Resend Email Service**
1. **Sign up** at [resend.com](https://resend.com)
2. **Get API key** from your dashboard
3. **Verify domain** for sending emails
4. **Add API key** to environment variables

### **Alternative Email Services**
- **SendGrid**: Replace `resend` with `@sendgrid/mail`
- **AWS SES**: Use AWS SDK for email sending
- **SMTP**: Configure with nodemailer

---

## **🔔 Notification System Features**

### **Notification Types**
- **System**: Important updates and maintenance
- **Inquiry**: New domain inquiries
- **Message**: Communication between users
- **Deal**: Deal status updates
- **Payment**: Payment confirmations
- **Domain**: Domain verification updates

### **Delivery Methods**
- **Email**: HTML emails with templates
- **Push**: Browser push notifications (future)
- **In-App**: Real-time notifications in UI

### **Priority Levels**
- **Urgent**: Critical system issues
- **High**: Important business events
- **Medium**: Regular updates
- **Low**: Informational messages

---

## **⚙️ Configuration Options**

### **Email Preferences**
```typescript
interface NotificationPreferences {
  email: boolean;           // Email notifications
  push: boolean;            // Push notifications
  inApp: boolean;           // In-app notifications
  categories: {             // Category preferences
    system: boolean;
    inquiry: boolean;
    message: boolean;
    deal: boolean;
    payment: boolean;
    domain: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}
```

### **Email Templates**
- **Verification**: Welcome and email verification
- **Password Reset**: Password recovery
- **Inquiry Alert**: New inquiry notifications
- **Message Alert**: New message notifications
- **Payment Alert**: Payment verification
- **Deal Update**: Deal status changes

---

## **🔧 Implementation Details**

### **Email Sending**
```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  from: 'noreply@geodomainland.com',
  to: 'user@example.com',
  subject: 'Welcome to GeoDomainLand',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome to GeoDomainLand!'
});
```

### **Notification Creation**
```typescript
import { createInquiryNotification } from '@/lib/notifications';

createInquiryNotification(
  'example.com',
  'John Doe',
  'high'
);
```

### **Component Usage**
```typescript
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

// In your layout or header
<NotificationCenter />

// In settings page
<NotificationPreferences />
```

---

## **📱 API Endpoints**

### **Test Email**
```bash
POST /api/email/test
{
  "email": "test@example.com"
}
```

### **Create Notification**
```bash
POST /api/notifications
{
  "type": "info",
  "title": "New Message",
  "message": "You have a new message",
  "category": "message",
  "priority": "medium"
}
```

### **Get Notifications**
```bash
GET /api/notifications
```

---

## **🎨 Customization**

### **Email Templates**
1. **Create template files** in `src/emails/templates/`
2. **Use CSS-in-JS** for styling
3. **Add dynamic content** with template variables
4. **Test templates** with different data

### **Notification Styles**
1. **Modify colors** in `NotificationCenter.tsx`
2. **Add animations** for better UX
3. **Customize icons** for different categories
4. **Adjust layout** for mobile/desktop

---

## **🧪 Testing**

### **Email Testing**
1. **Use test API** endpoint
2. **Check email delivery** in Resend dashboard
3. **Verify templates** render correctly
4. **Test with different email clients**

### **Notification Testing**
1. **Create test notifications** via API
2. **Check persistence** across sessions
3. **Verify preferences** work correctly
4. **Test real-time updates**

---

## **📊 Monitoring & Analytics**

### **Email Metrics**
- **Delivery rate**: Successful email sends
- **Open rate**: Email opens
- **Click rate**: Link clicks
- **Bounce rate**: Failed deliveries

### **Notification Metrics**
- **Creation rate**: Notifications created
- **Read rate**: Notifications read
- **Action rate**: Action button clicks
- **Preference changes**: User setting updates

---

## **🔒 Security Considerations**

### **Email Security**
- **Rate limiting**: Prevent spam
- **Input validation**: Sanitize email content
- **Authentication**: Verify user permissions
- **Logging**: Track email activities

### **Notification Security**
- **User isolation**: Users only see their notifications
- **Content sanitization**: Prevent XSS attacks
- **Permission checks**: Verify access rights
- **Audit logging**: Track notification actions

---

## **🚀 Future Enhancements**

### **Planned Features**
- **Push notifications** for mobile
- **Email scheduling** for digest emails
- **Advanced templates** with dynamic content
- **Notification analytics** dashboard
- **Webhook support** for external integrations

### **Integration Possibilities**
- **Slack**: Send notifications to Slack channels
- **Discord**: Discord bot notifications
- **SMS**: Text message notifications
- **WhatsApp**: WhatsApp Business API

---

## **❓ Troubleshooting**

### **Common Issues**
1. **Emails not sending**: Check API key and domain verification
2. **Notifications not showing**: Verify component imports
3. **Preferences not saving**: Check localStorage permissions
4. **Template errors**: Validate HTML syntax

### **Debug Mode**
Enable debug logging:
```bash
DEBUG_EMAIL=true
DEBUG_NOTIFICATIONS=true
```

---

## **📚 Additional Resources**

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Zustand Documentation**: [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)
- **Date-fns Documentation**: [date-fns.org](https://date-fns.org)
- **Next.js API Routes**: [nextjs.org/docs/api-routes](https://nextjs.org/docs/api-routes)

---

## **✅ Setup Checklist**

- [ ] Install required dependencies
- [ ] Configure environment variables
- [ ] Set up Resend account and API key
- [ ] Verify domain for email sending
- [ ] Test email functionality
- [ ] Test notification system
- [ ] Customize email templates
- [ ] Configure notification preferences
- [ ] Test with real user scenarios
- [ ] Monitor email delivery rates

---

**Need Help?** Contact the development team or check the troubleshooting section above.
