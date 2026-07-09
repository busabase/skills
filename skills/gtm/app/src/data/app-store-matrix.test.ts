import type { ChannelListing, DirectoryListing, GTMProduct } from "gtm-data/types";
import { describe, expect, it } from "vitest";
import {
  type AppStoreMatrixRow,
  deriveAppStoreMatrix,
  PLATFORM_STORE_CHANNELS,
  summarizeAppStoreMatrix,
} from "./app-store-matrix";

const product = (id: string, overrides: Partial<GTMProduct> = {}): GTMProduct => ({
  id,
  businessLineId: id,
  name: id,
  emoji: "📦",
  kind: "digital-good",
  status: "active",
  description: { en: id },
  ...overrides,
});

const rowFor = (rows: AppStoreMatrixRow[], id: string) => {
  const row = rows.find((r) => r.product.id === id);
  if (!row) throw new Error(`no row for ${id}`);
  return row;
};

describe("deriveAppStoreMatrix", () => {
  it("skips products without platforms", () => {
    const rows = deriveAppStoreMatrix(
      [product("course", { platforms: undefined }), product("web-app", { platforms: ["web"] })],
      [],
      [],
    );
    expect(rows.map((r) => r.product.id)).toEqual(["web-app"]);
  });

  it("maps each platform to its store channel", () => {
    const rows = deriveAppStoreMatrix(
      [product("p", { platforms: ["web", "ios", "android", "macos", "windows"] })],
      [],
      [],
    );
    const channels = rowFor(rows, "p").targets.map((t) => t.meta?.channel);
    expect(channels).toEqual([
      "product-hunt",
      "ios-app-store",
      "google-play",
      "mac-app-store",
      "microsoft-store",
    ]);
  });

  it("marks linux as no-store and excludes it from coverage totals", () => {
    const rows = deriveAppStoreMatrix([product("p", { platforms: ["linux"] })], [], []);
    const row = rowFor(rows, "p");
    expect(row.targets[0]?.status).toBe("no-store");
    expect(row.coverage).toEqual({ covered: 0, total: 0 });
  });

  it("counts a matching channel listing as covered", () => {
    const listing: ChannelListing = {
      id: "mas-p",
      channel: "mac-app-store",
      productId: "p",
      businessLineId: "p",
      title: { en: "p" },
      description: { en: "p" },
      status: "draft",
      variants: [],
    };
    const rows = deriveAppStoreMatrix([product("p", { platforms: ["macos"] })], [listing], []);
    const target = rowFor(rows, "p").targets[0];
    expect(target?.status).toBe("covered");
    expect(target?.coveredBy).toMatchObject({ kind: "channel-listing", id: "mas-p" });
  });

  it("counts a business-line directory entry as covering web → Product Hunt", () => {
    const dir: DirectoryListing = {
      id: "ph-p",
      platform: "producthunt",
      displayName: "p on PH",
      url: "https://producthunt.com/p",
      category: "launch-platform",
      status: "planned",
      businessLineId: "p",
    };
    const rows = deriveAppStoreMatrix([product("p", { platforms: ["web"] })], [], [dir]);
    const target = rowFor(rows, "p").targets[0];
    expect(target?.status).toBe("covered");
    expect(target?.coveredBy).toMatchObject({ kind: "directory", id: "ph-p" });
  });

  it("leaves a target missing when nothing covers it", () => {
    const rows = deriveAppStoreMatrix([product("p", { platforms: ["windows"] })], [], []);
    expect(rowFor(rows, "p").targets[0]?.status).toBe("missing");
  });

  it("summarizes coverage excluding no-store platforms", () => {
    const listing: ChannelListing = {
      id: "mas-p",
      channel: "mac-app-store",
      productId: "p",
      businessLineId: "p",
      title: { en: "p" },
      description: { en: "p" },
      status: "draft",
      variants: [],
    };
    const rows = deriveAppStoreMatrix(
      [product("p", { platforms: ["macos", "windows", "linux"] })],
      [listing],
      [],
    );
    // macos covered, windows missing, linux excluded
    expect(summarizeAppStoreMatrix(rows)).toEqual({
      products: 1,
      storeTargets: 2,
      covered: 1,
      missing: 1,
    });
  });

  it("keeps every platform represented in the store-channel map", () => {
    for (const channels of Object.values(PLATFORM_STORE_CHANNELS)) {
      expect(Array.isArray(channels)).toBe(true);
    }
    expect(PLATFORM_STORE_CHANNELS.web[0]?.channel).toBe("product-hunt");
  });
});
