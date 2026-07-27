import { createBusabaseRpcClient } from "/vendor/busabase-sdk.js";

import { appConfig } from "./config.js";

const RPC_PATHS = {
  cloud: "/__busabase_api__/api/rpc/core",
  desktop: "/__busabase_api__/api/rpc",
};

export function createRuntimeClient() {
  const apiBasePath = RPC_PATHS[appConfig.deployment];
  if (!apiBasePath) throw new Error(`Unsupported deployment: ${appConfig.deployment}`);
  return createBusabaseRpcClient({
    apiBasePath,
    headers: appConfig.spaceId ? { "x-busabase-space": appConfig.spaceId } : {},
  });
}
