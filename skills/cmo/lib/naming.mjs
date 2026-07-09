export function slug(value, fallback = "item") {
  return (
    String(value || fallback)
      .trim()
      .toLowerCase()
      .replace(/https?:\/\//g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || fallback
  );
}

function productName(proposal = {}) {
  const explicit = proposal.product || proposal.product_name || proposal.product_slug;
  if (explicit) return explicit;
  const destination = String(proposal.destination_url || "");
  if (/buda\.im/i.test(destination) || /buda/i.test(proposal.title || "")) return "Buda.im";
  if (/aitable\.ai/i.test(destination) || /aitable/i.test(proposal.title || ""))
    return "AITable.ai";
  if (/bika\.ai/i.test(destination) || /bika/i.test(proposal.title || "")) return "Bika.ai";
  return "Product";
}

function icpSlug(proposal = {}) {
  const explicit = proposal.icp_slug || proposal.icp || proposal.target_icp;
  if (explicit) return slug(explicit, "icp");
  const text = `${proposal.title || ""} ${proposal.summary || ""}`.toLowerCase();
  if (text.includes("coding agent") || text.includes("codex") || text.includes("claude code"))
    return "ai-coding-agents";
  if (text.includes("open-source") || text.includes("framework"))
    return "open-source-agent-builders";
  if (text.includes("developer") || text.includes("workflow")) return "dev-prod-workflow";
  return "icp";
}

function marketLanguage(proposal = {}) {
  return proposal.market_language || proposal.market || proposal.locale || "US-EN";
}

function batchId(proposal = {}) {
  if (proposal.test_batch) return proposal.test_batch;
  const id = String(proposal.id || "");
  const match = id.match(/(20\d{2})(\d{2})\d{2}/);
  if (match) return `${match[1]}-${match[2]}-T01`;
  return "T01";
}

function objective(proposal = {}) {
  return String(proposal.objective || "CLICKS")
    .toUpperCase()
    .replace(/^TRAFFIC$/, "CLICKS");
}

function landingPageSlug(proposal = {}) {
  if (proposal.offer_slug) return proposal.offer_slug;
  const destination = String(proposal.destination_url || "");
  if (/buda\.im\/?$/i.test(destination)) return "LP:buda-home";
  try {
    const url = new URL(destination);
    const path = slug(url.pathname, "home");
    return `LP:${url.hostname.replace(/^www\./, "")}-${path}`.slice(0, 40);
  } catch {
    return "LP:default";
  }
}

function audienceSlug(group = {}, index = 0) {
  return slug(
    group.audience_slug || group.slug || group.name || `audience-${index + 1}`,
    `audience-${index + 1}`,
  );
}

function targetingCluster(group = {}) {
  const communities = (group.community_candidates || group.communities || [])
    .map((item) => String(item).replace(/^r\//i, ""))
    .filter(Boolean)
    .slice(0, 4);
  if (communities.length) return `communities:${communities.join("+")}`;
  const interests = (group.interests || []).filter(Boolean).slice(0, 4);
  if (interests.length) return `interests:${interests.join("+")}`;
  return "targeting:custom";
}

function angleSlug(angle = {}, index = 0) {
  return slug(
    angle.angle_slug || angle.slug || angle.angle || angle.headline || `angle-${index + 1}`,
    `angle-${index + 1}`,
  );
}

export function redditCampaignName(proposal = {}) {
  return [
    productName(proposal),
    `ICP:${icpSlug(proposal)}`,
    `Reddit:${objective(proposal)}`,
    marketLanguage(proposal),
    landingPageSlug(proposal),
    batchId(proposal),
  ]
    .join(" | ")
    .slice(0, 120);
}

export function redditAdGroupName(group = {}, proposal = {}, index = 0) {
  return [`AG:${audienceSlug(group, index)}`, targetingCluster(group), marketLanguage(proposal)]
    .join(" | ")
    .slice(0, 100);
}

export function redditPostName(angle = {}, index = 0) {
  return `post:${angleSlug(angle, index)}`.slice(0, 80);
}

export function redditAdName(
  group = {},
  angle = {},
  proposal = {},
  groupIndex = 0,
  angleIndex = 0,
) {
  return [
    `AD:${audienceSlug(group, groupIndex)}`,
    `Angle:${angleSlug(angle, angleIndex)}`,
    redditPostName(angle, angleIndex),
  ]
    .join(" | ")
    .slice(0, 160);
}
