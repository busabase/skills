import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
import { appConfig } from "./config.js";
import { messages } from "./messages.js";
import { getProvider } from "./providers/index.js";
import { connectionHintKey, getRuntime, runtimeLabel } from "./runtime.js";

const state = {
  provider: null,
  payload: null,
  runtime: null,
  activeBase: appConfig.ui.primary_base,
  selectedRecordId: null,
  query: "",
  authStatus: null,
};

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const displayValue = (value) => {
  if (value == null || value === "") return "-";
  if (Array.isArray(value)) return value.map((item) => displayValue(item)).join(", ");
  if (typeof value === "object")
    return value.name || value.title || value.id || JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const baseConfig = () =>
  appConfig.schema.bases.find((base) => base.key === state.activeBase) || appConfig.schema.bases[0];
const recordsForBase = () =>
  (state.payload?.records || []).filter((record) => record.baseKey === baseConfig()?.key);
const pageInfoForBase = () => state.payload?.pageInfo?.[baseConfig()?.key] || {};
const loadedCount = (count, hasMore) => `${count}${hasMore ? "+" : ""}`;
const primaryField = () => baseConfig()?.fields?.[0]?.slug || "name";
const filteredRecords = () => {
  const query = state.query.trim().toLowerCase();
  return query
    ? recordsForBase().filter((record) =>
        JSON.stringify(record.fields).toLowerCase().includes(query),
      )
    : recordsForBase();
};

const setMobileSidebar = (open) => {
  document.body.classList.toggle("sidebar-open", open);
  byId("sidebarScrim").hidden = !open;
};
const setMobileDetail = (open) => document.body.classList.toggle("mobile-detail-open", open);
const setText = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = value;
};

function renderNavigation() {
  byId("baseNav").innerHTML = appConfig.schema.bases
    .map(
      (base) => `
    <button class="nav-item ${base.key === state.activeBase ? "active" : ""}" type="button" data-base="${escapeHtml(base.key)}">
      <span>${escapeHtml(base.name)}</span>
      <span>${loadedCount((state.payload?.records || []).filter((record) => record.baseKey === base.key).length, state.payload?.pageInfo?.[base.key]?.nextCursor)}</span>
    </button>
  `,
    )
    .join("");
}

function renderMetrics() {
  const pending = (state.payload?.changeRequests || []).filter((request) =>
    ["in_review", "changes_requested", "approved", "conflict"].includes(request.status),
  ).length;
  const metrics = [
    [
      messages.totalRecords,
      loadedCount(
        state.payload?.records?.length || 0,
        Object.values(state.payload?.pageInfo || {}).some((page) => page.nextCursor),
      ),
    ],
    [messages.bases, state.payload?.bases?.length || 0],
    [messages.pending, loadedCount(pending, state.payload?.changeRequestPageInfo?.nextCursor)],
  ];
  byId("metrics").innerHTML = metrics
    .map(
      ([label, value]) => `
    <div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
  `,
    )
    .join("");
  setText("attentionValue", loadedCount(pending, state.payload?.changeRequestPageInfo?.nextCursor));
  setText("attentionCopy", pending ? messages.attentionPending : messages.attentionEmpty);
}

function renderList() {
  const base = baseConfig();
  const records = filteredRecords();
  setText("listTitle", base?.name || messages.records);
  setText("recordCount", loadedCount(records.length, pageInfoForBase().nextCursor));
  setText("mobileTitle", base?.name || appConfig.appName);
  byId("loadMore").hidden = !pageInfoForBase().nextCursor || Boolean(state.query);
  setText("loadMore", messages.loadMore);
  if (!records.length) {
    byId("recordList").innerHTML =
      `<div class="empty-list">${escapeHtml(state.query ? messages.noMatches : messages.noRecords)}</div>`;
    return;
  }
  const secondaryFields = (base?.fields || []).slice(1, 4);
  byId("recordList").innerHTML = records
    .map(
      (record) => `
    <button class="record-row ${record.id === state.selectedRecordId ? "selected" : ""}" type="button" data-record="${escapeHtml(record.id)}">
      <strong>${escapeHtml(displayValue(record.fields?.[primaryField()]))}</strong>
      <span>${secondaryFields.map((field) => escapeHtml(displayValue(record.fields?.[field.slug]))).join(" / ")}</span>
    </button>
  `,
    )
    .join("");
}

function renderDetail() {
  const record = recordsForBase().find((item) => item.id === state.selectedRecordId);
  byId("detailEmpty").hidden = Boolean(record);
  byId("detailContent").hidden = !record;
  if (!record) {
    setText("detailEmpty", messages.selectRecord);
    return;
  }
  const base = baseConfig();
  setText("detailEyebrow", base?.name || messages.record);
  setText("detailTitle", displayValue(record.fields?.[primaryField()]));
  byId("detailFields").innerHTML = (base?.fields || [])
    .slice(1)
    .map(
      (field) => `
    <div class="field-row"><span>${escapeHtml(field.name)}</span><strong>${escapeHtml(displayValue(record.fields?.[field.slug]))}</strong></div>
  `,
    )
    .join("");
}

function renderSettings() {
  const provider = state.payload?.provider || {};
  const recordBudgets = appConfig.schema.bases
    .map((base) => `${base.name}: ${base.readLimit}`)
    .join("; ");
  const rows = [
    [messages.provider, provider.name || state.provider.name],
    [messages.mode, provider.mode || messages.notSet],
    [messages.runtime, state.runtime ? runtimeLabel(state.runtime) : messages.notSet],
    [messages.deployment, appConfig.deployment],
    [
      messages.space,
      state.authStatus?.selectedSpace
        ? `${state.authStatus.selectedSpace.name} (${state.authStatus.selectedSpace.id})`
        : appConfig.spaceId || messages.notSet,
    ],
    [messages.configuredBases, appConfig.schema.bases.map((base) => base.slug).join(", ")],
    [messages.initialWindow, `${recordBudgets}; 20 pending reviews`],
  ];
  byId("settingsGrid").innerHTML = rows
    .map(
      ([label, value]) => `
    <div class="settings-row"><span>${escapeHtml(label)}</span><code>${escapeHtml(value)}</code></div>
  `,
    )
    .join("");
}

// Connection UX Contract gate — `busabase-sdk/airapp-gate`, configured. The
// three screens (connect / choose a Space / initialize the workspace), the
// state machine behind them, and their stylesheet all live in the SDK; only
// this app's name and demo escape hatch are its own. `shouldGate` is passed
// explicitly rather than letting the SDK infer it from a status probe: where
// this app runs is a fact its host states (`BUSABASE_AIRAPP_RUNTIME`,
// surfaced through runtime.js's `getRuntime()`), never something to guess
// from the hostname — see runtime.js for why both directions of that guess
// are wrong.
const isDemo = () => new URLSearchParams(window.location.search).get("demo") === "1";

const gate = createAirAppConnectGate({
  appName: appConfig.appName,
  demoHref: "?demo=1",
  shouldGate: () => !isDemo() && !state.runtime?.hosted,
  onProvision: () => {
    throw new Error(
      "This template does not self-provision; resources are created at scaffold time.",
    );
  },
});

function render() {
  document.documentElement.lang = appConfig.locale;
  document.documentElement.style.setProperty("--accent", appConfig.brand?.accent || "#176B5B");
  document.title = appConfig.appName;
  setText("brandName", appConfig.appName);
  setText("brandDescription", appConfig.description);
  setText("viewEyebrow", messages.overview);
  setText("viewTitle", appConfig.appName);
  setText("viewSummary", appConfig.ui.summary);
  setText("attentionTitle", messages.attentionTitle);
  setText("listEyebrow", messages.records);
  setText("searchLabel", messages.search);
  byId("searchInput").placeholder = messages.searchPlaceholder;
  setText("settingsOpen", messages.settings);
  setText("settingsEyebrow", messages.settingsEyebrow);
  setText("settingsTitle", messages.settingsTitle);
  setText("backButton", messages.back);
  renderNavigation();
  renderMetrics();
  renderList();
  renderDetail();
  renderSettings();
}

async function load() {
  setText("loadingState", messages.loading);
  byId("errorState").hidden = true;
  // Resolved before the first data call so a failure can be explained in terms
  // of where this app actually runs. It must never gate the call itself: the
  // runtime decides what to TELL the user, the API decides what is possible.
  state.runtime = await getRuntime();
  try {
    const ready = await gate.pass({ onReady: load });
    if (!ready) {
      setText("loadingState", "");
      return;
    }
    state.authStatus = await gate.status();
    state.provider = await getProvider();
    state.payload = await state.provider.getState();
    setText("loadingState", "");
    render();
  } catch (error) {
    setText("loadingState", "");
    byId("errorState").hidden = false;
    const reason = error instanceof Error ? error.message : String(error);
    setText("errorState", `${reason} ${messages[connectionHintKey(state.runtime)]}`);
  }
}

async function loadMore() {
  const baseKey = baseConfig()?.key;
  const cursor = pageInfoForBase().nextCursor;
  if (!baseKey || !cursor || typeof state.provider?.loadMore !== "function") return;
  byId("loadMore").disabled = true;
  setText("loadMore", messages.loadingMore);
  try {
    const page = await state.provider.loadMore(baseKey, cursor);
    const known = new Set((state.payload.records || []).map((record) => record.id));
    state.payload.records.push(...page.records.filter((record) => !known.has(record.id)));
    state.payload.pageInfo[baseKey].nextCursor = page.nextCursor;
    render();
  } catch {
    setText("loadMore", messages.loadMoreFailed);
  } finally {
    byId("loadMore").disabled = false;
  }
}

byId("baseNav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-base]");
  if (!button) return;
  state.activeBase = button.dataset.base;
  state.selectedRecordId = null;
  state.query = "";
  byId("searchInput").value = "";
  window.location.hash = `#/base/${state.activeBase}`;
  setMobileSidebar(false);
  setMobileDetail(false);
  render();
});

byId("recordList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-record]");
  if (!button) return;
  state.selectedRecordId = button.dataset.record;
  window.location.hash = `#/base/${state.activeBase}/${state.selectedRecordId}`;
  setMobileDetail(true);
  renderList();
  renderDetail();
});

byId("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderList();
});
byId("loadMore").addEventListener("click", loadMore);
byId("sidebarOpen").addEventListener("click", () => setMobileSidebar(true));
byId("sidebarClose").addEventListener("click", () => setMobileSidebar(false));
byId("sidebarScrim").addEventListener("click", () => setMobileSidebar(false));
byId("backButton").addEventListener("click", () => {
  state.selectedRecordId = null;
  window.location.hash = `#/base/${state.activeBase}`;
  setMobileDetail(false);
  renderList();
  renderDetail();
});

const setSettings = (open) => {
  byId("settingsModal").hidden = !open;
  if (open) renderSettings();
};
byId("settingsOpen").addEventListener("click", () => setSettings(true));
byId("mobileSettings").addEventListener("click", () => setSettings(true));
byId("settingsClose").addEventListener("click", () => setSettings(false));
byId("settingsModal").addEventListener("click", (event) => {
  if (event.target === byId("settingsModal")) setSettings(false);
});
window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 720px)").matches) {
    setMobileSidebar(false);
    setMobileDetail(false);
  }
});

load();
