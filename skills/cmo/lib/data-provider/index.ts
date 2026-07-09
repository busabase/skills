// Data provider selector.
//
// The default backing store is local files. Every provider implements the same
// polymorphic contract — `CmoDataProvider` in ./provider-interface.ts — so the
// Hono app / scripts can graduate to a database or cloud service (`busabase`, and
// future `postgres` / `aitable` / `notion`) by changing CMO_DATA_PROVIDER only,
// not by rewriting callers. `class … implements CmoDataProvider` gives the
// compile-time check; `assertProvider()` is the runtime backstop, so a
// non-conforming provider fails loudly here instead of at the first missing-method
// call deep in a request.
//
// Erasable-TS only (Node ≥23.6 native strip; no build).

import { busabaseProvider } from "./busabase-provider.ts";
import { localFileProvider } from "./local-file-provider.ts";
import { assertProvider, type CmoDataProvider } from "./provider-interface.ts";

const providers: Record<string, CmoDataProvider> = {
  local: localFileProvider,
  busabase: busabaseProvider,
};

const validated = new Map<string, CmoDataProvider>();

export function getProvider(): CmoDataProvider {
  const selected = process.env.CMO_DATA_PROVIDER || "local";
  const cached = validated.get(selected);
  if (cached) return cached;
  const provider = providers[selected];
  if (!provider) {
    throw new Error(
      `Unknown CMO_DATA_PROVIDER "${selected}". Available: ${Object.keys(providers).join(", ")}`,
    );
  }
  const conformed = assertProvider(selected, provider);
  validated.set(selected, conformed);
  return conformed;
}
