/**
 * Feature Flag Manager
 * 
 * This module provides admin controls for managing feature flags
 * and monitoring the hybrid inquiry system.
 */

import { prisma } from '@/lib/prisma';

export interface FeatureFlagConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  enabledForUsers: string[];
  enabledForRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagStats {
  totalUsers: number;
  enabledUsers: number;
  enabledPercentage: number;
  lastUpdated: Date;
}

/**
 * Get current feature flag configuration
 */
export async function getFeatureFlagConfig(): Promise<FeatureFlagConfig[]> {
  // For now, we'll use environment variables
  // In a full implementation, this would be stored in the database
  return [
    {
      id: 'direct-messaging',
      name: 'Direct Messaging',
      description: 'Enable direct communication between buyers and sellers after inquiry approval',
      enabled: process.env.NEXT_PUBLIC_ENABLE_DIRECT_MESSAGING === 'true',
      rolloutPercentage: 0,
      enabledForUsers: [],
      enabledForRoles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'contact-info-detection',
      name: 'Contact Info Detection',
      description: 'Automatically detect and flag messages containing contact information',
      enabled: process.env.NEXT_PUBLIC_ENABLE_CONTACT_INFO_DETECTION === 'true',
      rolloutPercentage: 0,
      enabledForUsers: [],
      enabledForRoles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'inquiry-deals',
      name: 'Inquiry Deals',
      description: 'Allow converting inquiries directly to deals',
      enabled: process.env.NEXT_PUBLIC_ENABLE_INQUIRY_DEALS === 'true',
      rolloutPercentage: 0,
      enabledForUsers: [],
      enabledForRoles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'message-flagging',
      name: 'Message Flagging',
      description: 'Enable automatic flagging of messages for admin review',
      enabled: process.env.NEXT_PUBLIC_ENABLE_MESSAGE_FLAGGING === 'true',
      rolloutPercentage: 0,
      enabledForUsers: [],
      enabledForRoles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Get feature flag statistics
 */
export async function getFeatureFlagStats(): Promise<FeatureFlagStats> {
  const totalUsers = await prisma.user.count({
    where: { status: 'ACTIVE' }
  });

  // For now, we'll calculate based on environment variables
  // In a full implementation, this would be based on actual user assignments
  const enabledUsers = totalUsers; // All users if enabled, 0 if disabled
  const enabledPercentage = process.env.NEXT_PUBLIC_ENABLE_DIRECT_MESSAGING === 'true' ? 100 : 0;

  return {
    totalUsers,
    enabledUsers,
    enabledPercentage,
    lastUpdated: new Date(),
  };
}

/**
 * Check if a feature is enabled for a specific user
 */
export async function isFeatureEnabledForUser(featureId: string, userId: string): Promise<boolean> {
  const configs = await getFeatureFlagConfig();
  const config = configs.find(c => c.id === featureId);
  
  if (!config) return false;
  if (!config.enabled) return false;
  
  // For now, if the feature is enabled globally, it's enabled for all users
  // In a full implementation, this would check user-specific settings
  return config.enabled;
}

/**
 * Get hybrid system statistics
 */
export async function getHybridSystemStats() {
  const [
    totalInquiries,
    openInquiries,
    convertedDeals,
    flaggedMessages,
    directMessages,
    adminMediatedMessages,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: 'OPEN' } }),
    prisma.inquiryDeal.count(),
    prisma.message.count({ where: { flagged: true } }),
    prisma.message.count({ where: { status: 'DELIVERED' } }),
    prisma.message.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalInquiries,
    openInquiries,
    convertedDeals,
    flaggedMessages,
    directMessages,
    adminMediatedMessages,
    directMessagePercentage: totalInquiries > 0 ? Math.round((directMessages / totalInquiries) * 100) : 0,
    flaggedMessagePercentage: totalInquiries > 0 ? Math.round((flaggedMessages / totalInquiries) * 100) : 0,
  };
}

/**
 * Get recent activity for monitoring
 */
export async function getRecentActivity() {
  const [
    recentInquiries,
    recentMessages,
    recentDeals,
    recentFlaggedMessages,
  ] = await Promise.all([
    prisma.inquiry.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        domain: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
    }),
    prisma.message.findMany({
      take: 10,
      orderBy: { sentDate: 'desc' },
      include: {
        inquiry: { include: { domain: { select: { name: true } } } },
        sender: { select: { name: true, email: true } },
      },
    }),
    prisma.inquiryDeal.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        inquiry: { include: { domain: { select: { name: true } } } },
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
    }),
    prisma.message.findMany({
      take: 10,
      where: { flagged: true },
      orderBy: { sentDate: 'desc' },
      include: {
        inquiry: { include: { domain: { select: { name: true } } } },
        sender: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    recentInquiries,
    recentMessages,
    recentDeals,
    recentFlaggedMessages,
  };
}
