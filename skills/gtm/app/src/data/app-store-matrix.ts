/**
 * App-store 上架矩阵 (listing matrix) — pure, isomorphic derivation.
 *
 * A product declares the platforms it ships on (`GTMProduct.platforms`); this
 * module derives which store(s) it should therefore be listed on, then checks
 * existing `ChannelListing` / `DirectoryListing` data to mark each target as
 * covered or missing. No DB, no React — safe to import from anywhere.
 *
 *   web     → Product Hunt (launch-discovery)
 *   ios     → iOS App Store
 *   android → Google Play
 *   macos   → Mac App Store
 *   windows → Microsoft Store
 *   linux   → (no first-party consumer store; surfaced as "no store")
 */

import type {
  ChannelListing,
  CommerceChannel,
  CommerceTrafficTier,
  DirectoryListing,
  GTMProduct,
  ProductPlatform,
} from "gtm-data/types";

export interface AppStoreChannelMeta {
  channel: CommerceChannel;
  label: string;
  emoji: string;
  trafficTier: CommerceTrafficTier;
  /** Matches `DirectoryListing.platform` so existing directory entries count as coverage. */
  directoryPlatform?: string;
}

/** Store channels keyed by the platform that requires them. */
export const PLATFORM_STORE_CHANNELS: Record<ProductPlatform, AppStoreChannelMeta[]> = {
  web: [
    {
      channel: "product-hunt",
      label: "Product Hunt",
      emoji: "🚀",
      trafficTier: "launch-discovery",
      directoryPlatform: "producthunt",
    },
  ],
  ios: [
    {
      channel: "ios-app-store",
      label: "iOS App Store",
      emoji: "",
      trafficTier: "app-store",
      directoryPlatform: "ios-app-store",
    },
  ],
  android: [
    {
      channel: "google-play",
      label: "Google Play",
      emoji: "🤖",
      trafficTier: "app-store",
      directoryPlatform: "google-play",
    },
  ],
  macos: [
    {
      channel: "mac-app-store",
      label: "Mac App Store",
      emoji: "",
      trafficTier: "app-store",
      directoryPlatform: "mac-app-store",
    },
  ],
  windows: [
    {
      channel: "microsoft-store",
      label: "Microsoft Store",
      emoji: "🪟",
      trafficTier: "app-store",
      directoryPlatform: "microsoft-store",
    },
  ],
  // No first-party consumer app store; teams distribute via their own site / package managers.
  linux: [],
};

export const PRODUCT_PLATFORM_LABEL: Record<ProductPlatform, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
};

export type AppStoreTargetStatus = "covered" | "missing" | "no-store";

export interface AppStoreTarget {
  platform: ProductPlatform;
  /** The store this platform requires; null when the platform has no store. */
  meta: AppStoreChannelMeta | null;
  status: AppStoreTargetStatus;
  /** What proves coverage, when covered. */
  coveredBy?: {
    kind: "channel-listing" | "directory";
    id: string;
    status: string;
    url?: string;
  };
}

export interface AppStoreMatrixRow {
  product: GTMProduct;
  platforms: ProductPlatform[];
  targets: AppStoreTarget[];
  /** Counts only platforms that actually require a store. */
  coverage: { covered: number; total: number };
}

export interface AppStoreMatrixSummary {
  products: number;
  storeTargets: number;
  covered: number;
  missing: number;
}

function findCoverage(
  product: GTMProduct,
  meta: AppStoreChannelMeta,
  channelListings: ChannelListing[],
  directories: DirectoryListing[],
): AppStoreTarget["coveredBy"] | undefined {
  const listing = channelListings.find(
    (item) => item.channel === meta.channel && item.productId === product.id,
  );
  if (listing) {
    return { kind: "channel-listing", id: listing.id, status: listing.status, url: listing.url };
  }

  // Directories are business-line scoped — match by platform + business line.
  if (meta.directoryPlatform) {
    const dir = directories.find(
      (item) =>
        item.platform === meta.directoryPlatform &&
        (item.businessLineId === undefined || item.businessLineId === product.businessLineId),
    );
    if (dir) {
      return { kind: "directory", id: dir.id, status: dir.status, url: dir.url || undefined };
    }
  }
  return undefined;
}

/**
 * Derive the per-product app-store matrix. Products without `platforms` (courses,
 * services, raw credits) are skipped — they have no store presence to track.
 */
export function deriveAppStoreMatrix(
  products: GTMProduct[],
  channelListings: ChannelListing[],
  directories: DirectoryListing[],
): AppStoreMatrixRow[] {
  return products
    .filter((product) => product.platforms && product.platforms.length > 0)
    .map((product) => {
      const platforms = product.platforms ?? [];
      const targets: AppStoreTarget[] = platforms.flatMap((platform): AppStoreTarget[] => {
        const channels = PLATFORM_STORE_CHANNELS[platform];
        if (channels.length === 0) {
          return [{ platform, meta: null, status: "no-store" }];
        }
        return channels.map((meta): AppStoreTarget => {
          const coveredBy = findCoverage(product, meta, channelListings, directories);
          return {
            platform,
            meta,
            status: coveredBy ? "covered" : "missing",
            coveredBy,
          };
        });
      });

      const storeTargets = targets.filter((target) => target.meta !== null);
      const covered = storeTargets.filter((target) => target.status === "covered").length;
      return {
        product,
        platforms,
        targets,
        coverage: { covered, total: storeTargets.length },
      };
    });
}

export function summarizeAppStoreMatrix(rows: AppStoreMatrixRow[]): AppStoreMatrixSummary {
  const storeTargets = rows.flatMap((row) => row.targets.filter((target) => target.meta !== null));
  const covered = storeTargets.filter((target) => target.status === "covered").length;
  return {
    products: rows.length,
    storeTargets: storeTargets.length,
    covered,
    missing: storeTargets.length - covered,
  };
}
