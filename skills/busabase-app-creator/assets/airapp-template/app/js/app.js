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

const isDemo = () => new URLSearchParams(window.location.search).get("demo") === "1";

/**
 * The local `/auth/*` gateway exists only in a standalone run, so consult it
 * only there. `runtime.hosted` comes from the env var Busabase injects into the
 * process it spawned — not from the hostname, the path, or whether we are in an
 * iframe. Those all misclassify: a hosted AirApp is served from `localhost` on
 * Desktop/OSS, and a standalone app reached over a dev tunnel is neither
 * loopback nor a hosted preview path, which used to skip the connect gate
 * entirely and leave the user with an unactionable error.
 *
 * `unknown` (the probe did not answer) is treated as standalone on purpose:
 * showing a connect gate that turns out to be unnecessary is recoverable,
 * silently skipping a required one is not.
 */
const shouldUseLocalGateway = (runtime) => !runtime.hosted;

const setupOption = (value, title, hint, checked = false) => `
  <label class="setup-option">
    <input type="radio" name="server_mode" value="${value}" ${checked ? "checked" : ""}>
    <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small></span>
  </label>`;

function showSetup(status) {
  let overlay = byId("setupGate");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "setupGate";
    overlay.className = "setup-gate";
    document.body.append(overlay);
  }
  const oauthError = new URLSearchParams(window.location.search).get("oauth_error");
  const safeError = oauthError || status.message || "";
  const footer = `<footer class="setup-footer"><span>${escapeHtml(messages.localCredential)}</span><a href="?demo=1">${escapeHtml(messages.demo)}</a></footer>`;

  if (status.readiness === "needs_space") {
    const choices = (status.spaces || [])
      .map(
        (space, index) =>
          `<label class="space-option"><input type="radio" name="space_id" value="${escapeHtml(space.id)}" ${index === 0 ? "checked" : ""}><span><strong>${escapeHtml(space.name)}</strong><code>${escapeHtml(space.id)}</code></span></label>`,
      )
      .join("");
    overlay.innerHTML = `<section class="setup-panel" aria-labelledby="setupTitle"><header><span class="eyebrow">${escapeHtml(messages.setupEyebrow)}</span><h1 id="setupTitle">${escapeHtml(messages.spaceTitle)}</h1><p>${escapeHtml(status.spaces?.length ? messages.spaceCopy : messages.noSpaces)}</p></header>${safeError ? `<div class="setup-error" role="alert">${escapeHtml(safeError)}</div>` : ""}<form class="setup-form" data-space-form>${choices}<button class="setup-primary" type="submit" ${choices ? "" : "disabled"}>${escapeHtml(messages.selectSpace)}</button></form>${footer}</section>`;
    const form = overlay.querySelector("[data-space-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      const response = await fetch("/auth/space", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (response.ok) window.location.reload();
      else {
        const body = await response.json().catch(() => ({}));
        showSetup({ ...status, message: body.error || messages.retry });
      }
    });
    return;
  }

  if (status.readiness === "retry") {
    overlay.innerHTML = `<section class="setup-panel" aria-labelledby="setupTitle"><header><span class="eyebrow">${escapeHtml(messages.setupEyebrow)}</span><h1 id="setupTitle">${escapeHtml(messages.retryTitle)}</h1></header><div class="setup-error" role="alert">${escapeHtml(safeError || messages.retryTitle)}</div><div class="setup-actions"><button class="setup-primary" type="button" data-retry>${escapeHtml(messages.retry)}</button></div>${footer}</section>`;
    overlay
      .querySelector("[data-retry]")
      ?.addEventListener("click", () => window.location.reload());
    return;
  }

  overlay.innerHTML = `<section class="setup-panel" aria-labelledby="setupTitle"><header><span class="eyebrow">${escapeHtml(messages.setupEyebrow)}</span><h1 id="setupTitle">${escapeHtml(messages.connectTitle)}</h1><p>${escapeHtml(messages.connectCopy)}</p></header>${safeError ? `<div class="setup-error" role="alert">${escapeHtml(safeError)}</div>` : ""}<form class="setup-form" method="post" action="/auth/start" data-connect-form><fieldset><legend class="sr-only">Server</legend>${setupOption("cloud", messages.cloud, "busabase.com", true)}${setupOption("custom", messages.customServer, messages.customServerHint)}</fieldset><label class="custom-origin" hidden><span>${escapeHtml(messages.serverUrl)}</span><input type="url" name="custom_base_url" autocomplete="url" placeholder="https://busabase.example.com"></label><input type="hidden" name="base_url" value="${escapeHtml(status.cloudBaseUrl || "https://busabase.com")}"><button class="setup-primary" type="submit">${escapeHtml(status.readiness === "needs_auth" ? messages.reconnect : messages.connect)}</button></form>${footer}</section>`;
  const form = overlay.querySelector("[data-connect-form]");
  const baseUrl = form?.querySelector('[name="base_url"]');
  const custom = form?.querySelector(".custom-origin");
  const customInput = form?.querySelector('[name="custom_base_url"]');
  form?.querySelectorAll('[name="server_mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const customMode = radio.checked && radio.value === "custom";
      custom.hidden = !customMode;
      customInput.required = customMode;
      if (!customMode) baseUrl.value = status.cloudBaseUrl || "https://busabase.com";
    });
  });
  customInput?.addEventListener("input", () => {
    baseUrl.value = customInput.value;
  });
}

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
    if (!isDemo() && shouldUseLocalGateway(state.runtime)) {
      state.authStatus = await fetch("/auth/status", {
        headers: { accept: "application/json" },
      }).then((response) => response.json());
      if (state.authStatus.readiness !== "ready") {
        setText("loadingState", "");
        showSetup(state.authStatus);
        return;
      }
    }
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
