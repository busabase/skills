#!/usr/bin/env node
// Verify the CMO busabase data provider against a running Busabase server.
//
// Local (default):  busabase server            # in another terminal, :15419
//                   node scripts/verify-busabase.mjs
// Cloud:            BUSABASE_BASE_URL=https://busabase.com \
//                   BUSABASE_API_KEY=sk-... [BUSABASE_SPACE_ID=...] \
//                   node scripts/verify-busabase.mjs
//
// Read-only by default (health + auth + list CRs + agent tasks). Add --write to
// also run the mutating round-trip: create a Change Request against
// BUSABASE_CMO_BASE_ID, request changes, then close it.

import { busabaseProvider as busabase } from "../lib/data-provider/busabase-provider.ts";

const write = process.argv.includes("--write");
const line = (label, value) => console.log(`  ${label.padEnd(22)} ${value}`);

async function main() {
  console.log("\n=== CMO ↔ Busabase provider verification ===");
  console.log(`base_url = ${process.env.BUSABASE_BASE_URL || "http://localhost:15419"}\n`);

  // 1. Connectivity + auth/space
  const conn = await busabase.verifyConnection();
  line("healthy", conn.healthy ? "yes" : "NO (is `busabase server` running?)");
  line("has_api_key", conn.has_api_key ? "yes" : "no (local OSS is open)");
  line("user", conn.user?.name ?? "(none / local)");
  line("space", conn.space?.name ?? "(default)");
  line("spaces", (conn.spaces || []).map((s) => s.name).join(", ") || "(none)");
  if (!conn.healthy) {
    console.log("\n✗ Server not reachable. Start it with `busabase server` then retry.\n");
    process.exit(1);
  }

  // 2. Read: state (proposals from CRs) + agent tasks
  const state = await busabase.getState();
  line("data_provider", state.data_provider);
  line("provider_error", state.provider_error ?? "(none)");
  line("proposals", String(state.batch?.proposals?.length ?? 0));
  line("counts", JSON.stringify(state.counts));
  const tasks = await busabase.getAgentTasks();
  line("agent_tasks", String(tasks.tasks.length));

  if (!write) {
    console.log("\n✓ Read-only checks passed. Re-run with --write to test the CR lifecycle.\n");
    return;
  }

  // 3. Write round-trip (needs a target base)
  const baseId = process.env.BUSABASE_CMO_BASE_ID;
  if (!baseId) {
    console.log("\n! --write needs BUSABASE_CMO_BASE_ID (the CMO proposals base). Skipping.\n");
    return;
  }
  console.log("\n--- write round-trip ---");
  const cr = await busabase.createProposal(
    { title: "CMO verify proposal", summary: "created by verify-busabase.mjs" },
    { baseId, message: "verify-busabase" },
  );
  line("created CR", `${cr.id} (${cr.status})`);
  await busabase.submitReviewDecision({
    id: cr.id,
    action: "request_changes",
    comment: "please revise",
  });
  const after = (await busabase.getState()).batch.proposals.find((p) => p.id === cr.id);
  line("after request_changes", after ? `${after.cr_status} → ui:${after.status}` : "(not found)");
  await busabase.submitReviewDecision({ id: cr.id, action: "block", comment: "verify cleanup" });
  const closed = (await busabase.getState()).batch.proposals.find((p) => p.id === cr.id);
  line("after block", closed ? `${closed.cr_status} → ui:${closed.status}` : "(closed/removed)");
  console.log("\n✓ Write round-trip complete.\n");
}

main().catch((error) => {
  console.error("\n✗ verification failed:", error.message);
  process.exit(1);
});
