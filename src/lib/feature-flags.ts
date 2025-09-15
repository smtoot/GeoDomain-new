/**
 * Feature Flags for Hybrid Inquiry System
 * 
 * This file manages feature flags for the gradual rollout of the hybrid inquiry system.
 * All flags are disabled by default to ensure backward compatibility.
 */

export interface FeatureFlags {
  enableDirectMessaging: boolean;
  enableContactInfoDetection: boolean;
  enableInquiryDeals: boolean;
  enableMessageFlagging: boolean;
}

/**
 * Get feature flags from environment variables
 * All flags default to false for safety
 */
export const getFeatureFlags = (): FeatureFlags => {
  return {
    enableDirectMessaging: process.env.NEXT_PUBLIC_ENABLE_DIRECT_MESSAGING === 'true',
    enableContactInfoDetection: process.env.NEXT_PUBLIC_ENABLE_CONTACT_INFO_DETECTION === 'true',
    enableInquiryDeals: process.env.NEXT_PUBLIC_ENABLE_INQUIRY_DEALS === 'true',
    enableMessageFlagging: process.env.NEXT_PUBLIC_ENABLE_MESSAGE_FLAGGING === 'true',
  };
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};

/**
 * Get feature flags for a specific user (for A/B testing)
 * This allows gradual rollout to specific users
 */
export const getUserFeatureFlags = (userId: string): FeatureFlags => {
  const baseFlags = getFeatureFlags();
  
  // If features are globally disabled, return disabled flags
  if (!baseFlags.enableDirectMessaging) {
    return baseFlags;
  }
  
  // Simple hash-based A/B testing (10% of users)
  const hash = simpleHash(userId);
  const isInTestGroup = hash % 10 === 0;
  
  return {
    ...baseFlags,
    enableDirectMessaging: isInTestGroup,
    enableContactInfoDetection: isInTestGroup,
    enableInquiryDeals: isInTestGroup,
    enableMessageFlagging: isInTestGroup,
  };
};

/**
 * Simple hash function for user ID
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Feature flag constants for easy reference
 */
export const FEATURE_FLAGS = {
  DIRECT_MESSAGING: 'enableDirectMessaging',
  CONTACT_INFO_DETECTION: 'enableContactInfoDetection',
  INQUIRY_DEALS: 'enableInquiryDeals',
  MESSAGE_FLAGGING: 'enableMessageFlagging',
} as const;
