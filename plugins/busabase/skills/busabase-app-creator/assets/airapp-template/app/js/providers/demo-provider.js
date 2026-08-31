import { appConfig } from "../config.js";

export const demoProvider = {
  name: "demo",
  async getState() {
    const records = appConfig.demoRecords.map((record) => ({
      id: record.id,
      baseKey: record.baseKey,
      fields: record.fields,
    }));
    return {
      provider: { ok: true, name: "demo", mode: "deterministic_local_demo", readOnly: true },
      bases: appConfig.schema.bases.map((base) => ({
        id: `demo-base-${base.key}`,
        slug: base.slug,
        name: base.name,
        fields: base.fields,
      })),
      records,
      pageInfo: Object.fromEntries(
        appConfig.schema.bases.map((base) => [
          base.key,
          { nextCursor: null, limit: base.readLimit },
        ]),
      ),
      // The demo fixture is small and fully in memory, so its own count is
      // exact by construction -- no records.count call needed.
      totalCount: Object.fromEntries(
        appConfig.schema.bases.map((base) => [
          base.key,
          records.filter((record) => record.baseKey === base.key).length,
        ]),
      ),
      changeRequests: [],
      changeRequestPageInfo: { nextCursor: null, limit: 20 },
    };
  },
};
