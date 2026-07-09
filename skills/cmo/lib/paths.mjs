import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_DIR = path.resolve(LIB_DIR, "..");
export const APP_DIR = path.join(SKILL_DIR, "app");
export const SERVER_DIR = path.join(APP_DIR, "server");
export const DATA_DIR = path.join(APP_DIR, ".data");
export const STATE_DIR = path.join(SKILL_DIR, "state");
export const CURRENT_BATCH_PATH = path.join(DATA_DIR, "current_batch.json");
export const DECISIONS_PATH = path.join(DATA_DIR, "decisions.json");
export const PLATFORM_SNAPSHOT_PATH = path.join(DATA_DIR, "platform_snapshot.json");
export const EXECUTION_REPORT_PATH = path.join(DATA_DIR, "execution_report.json");
export const ONBOARDING_PATH = path.join(DATA_DIR, "onboarding.json");
export const AGENT_TASKS_PATH = path.join(DATA_DIR, "agent_tasks.json");
export const GEO_SNAPSHOT_PATH = path.join(DATA_DIR, "geo_snapshot.json");
export const MARKETING_SNAPSHOT_PATH = path.join(DATA_DIR, "marketing.json");
export const DIST_DIR = path.join(APP_DIR, "dist");
export const SEM_STATE_PATH = path.join(STATE_DIR, "sem-state.json");
export const LEGACY_GOOGLE_SEM_STATE_PATH = path.join(DATA_DIR, "google-sem-state.json");
export const LEGACY_ADS_SEM_STATE_PATH = path.join(
  path.resolve(SKILL_DIR, "..", "ads"),
  "state",
  "sem-state.json",
);
export const LOCK_PATH = path.join(DATA_DIR, "agent.lock");
export const LOG_PATH = path.join(DATA_DIR, "server.log");
export const PID_PATH = path.join(DATA_DIR, "server.pid");
export const CONFIG_EXAMPLE_PATH = path.join(SKILL_DIR, "config.example.json");
export const CONFIG_LOCAL_PATH = path.join(SKILL_DIR, "config.local.json");
export const LEGACY_ADS_CONFIG_LOCAL_PATH = path.join(
  path.resolve(SKILL_DIR, "..", "ads"),
  "config.local.json",
);
export const SOURCING_ADS_CONFIG_LOCAL_PATH = path.join(
  process.env.HOME || "/Users/kelly",
  "Documents",
  "sourcing",
  ".agents",
  "skills",
  "ads",
  "config.local.json",
);
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 3000;
export const PREFERRED_PORT_MIN = 3000;
export const PREFERRED_PORT_MAX = 4000;

export function findRepoRoot(start = SKILL_DIR) {
  let current = path.resolve(start);
  while (current && current !== path.dirname(current)) {
    if (existsSync(path.join(current, ".git"))) return current;
    current = path.dirname(current);
  }
  return path.resolve(SKILL_DIR, "../..");
}

export const ROOT_DIR = findRepoRoot();
