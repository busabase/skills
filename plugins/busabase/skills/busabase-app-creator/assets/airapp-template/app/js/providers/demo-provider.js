import { appConfig } from "../config.js";

export const demoProvider = {
  name: "demo",
  async getState() {
    return {
      provider: { ok: true, name: "demo", mode: "deterministic_local_demo", readOnly: true },
      bases: appConfig.schema.bases.map((base) => ({
        id: `demo-base-${base.key}`,
        slug: base.slug,
        name: base.name,
        fields: base.fields,
      })),
      records: appConfig.demoRecords.map((record) => ({
        id: record.id,
        baseKey: record.baseKey,
        fields: record.fields,
      })),
      pageInfo: Object.fromEntries(
        appConfig.schema.bases.map((base) => [
          base.key,
          { nextCursor: null, limit: base.readLimit },
        ]),
      ),
      changeRequests: [],
      changeRequestPageInfo: { nextCursor: null, limit: 20 },
    };
  },
};
