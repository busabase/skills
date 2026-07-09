/**
 * GTM shared configuration constants
 *
 * Kept here (not in component files) to ensure `pillar-scoring.ts` and all
 * UI pages stay in sync. Changing these updates both the scoring logic
 * and the UI.
 */

/**
 * Canonical Influencer Kit materials (based on /kit/influencer/*).
 * Used by both `pillar-scoring.ts` (Foundation scoring) and the Influencer Kit page.
 */
export const INFLUENCER_KIT_CATEGORIES = [
  { category: "influencer-product-brief", label: "Product Brief" },
  { category: "influencer-campaign-script", label: "Campaign Script" },
  { category: "influencer-thread-script", label: "Thread Script" },
  { category: "influencer-outreach-playbook", label: "Outreach Playbook" },
  { category: "influencer-asset-pack", label: "Asset Pack" },
] as const;

/** Subset used for Foundation pillar scoring (4 required canonical materials). */
export const INFLUENCER_KIT_REQUIRED_CATEGORIES = [
  "influencer-product-brief",
  "influencer-campaign-script",
  "influencer-thread-script",
  "influencer-outreach-playbook",
] as const;

/**
 * Platforms that count as "community" channels.
 * Used by `pillar-scoring.ts` (Retention scoring) and the Community page.
 * Keep this list narrow — only 2-way conversation / group channels count.
 */
export const COMMUNITY_PLATFORMS = ["discord", "telegram", "wechat-gzh"] as const;
