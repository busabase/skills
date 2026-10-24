import { airAppWriteMessage } from "../vendor/busabase-airapp.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
import { appConfig } from "./config.js";
import { messages } from "./messages.js";
import { getProvider } from "./providers/index.js";
import { connectionHintKey, getRuntime, runtimeLabel, shouldUseLocalGateway } from "./runtime.js";

const state = {
  provider: null,
  payload: null,
  runtime: null,
  // "overview" or "base". Overview is the only page that carries the hero and
  // the metrics band; a record view is one toolbar row and the table.
  page: "overview",
  activeBase: appConfig.ui.primary_base,
  selectedRecordId: null,
  // How the selected record is presented: "page" replaces the list, "drawer"
  // slides over its right edge, "split" sits in a fixed pane beside it.
  detailPresentation: null,
  detailRecord: null,
  query: "",
  detailError: "",
  authStatus: null,
  // The change-request action whose form is open, the outcome message of the
  // last write ({ tone, text }), and whether a write is in flight.
  activeAction: null,
  notice: null,
  saving: false,
};
let routeSerial = 0;
let previousRouteWasList = false;

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Busabase resource ids: rec records, bse Bases, bsf fields, nod nodes, cmt
// commits, crq change requests. None of them belong on screen — the reader can
// neither recognise one nor click it, and it looks like content while saying
// nothing. So the last resort here is "-", never the id and never JSON.
const RESOURCE_ID = /^(?:rec|bse|bsf|nod|cmt|crq)[a-z0-9]{10,}$/;
const displayValue = (value) => {
  if (value == null || value === "") return "-";
  if (Array.isArray(value)) return value.map((item) => displayValue(item)).join(", ");
  if (typeof value === "object") return value.name || value.title || "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value);
  return RESOURCE_ID.test(text) ? "-" : text;
};

// A relation field's value is the bare id of the target record, so printing it
// straight renders an opaque `rec...` id where a name belongs. Resolve it against
// the loaded records; when the target has not been paged in yet, say that rather
// than showing the id.
const cellText = (field, value) => {
  // A select cell stores the choice id ("recommended"); people read its name.
  if (field?.type === "select" || field?.type === "multiselect") {
    const choices = field.options?.choices || [];
    const label = (item) => choices.find((choice) => choice.id === item)?.name ?? item;
    return displayValue(Array.isArray(value) ? value.map(label) : label(value));
  }
  if (field?.type !== "relation") return displayValue(value);
  const targetKey = appConfig.schema.bases.find(
    (base) => base.slug === field.options?.targetBaseSlug,
  )?.key;
  const ids = (Array.isArray(value) ? value : [value])
    .map((item) => (item && typeof item === "object" ? item.id || item.name : item))
    .filter((item) => item != null && item !== "")
    .map(String);
  if (!ids.length) return "-";
  const targets = (state.payload?.records || []).filter((record) => record.baseKey === targetKey);
  const targetPrimary =
    appConfig.schema.bases.find((base) => base.key === targetKey)?.fields?.[0]?.slug || "name";
  return ids
    .map((id) => {
      const target = targets.find((record) => record.id === id);
      return target ? displayValue(target.fields?.[targetPrimary]) : messages.relationUnloaded;
    })
    .join(", ");
};

const baseConfig = () =>
  appConfig.schema.bases.find((base) => base.key === state.activeBase) || appConfig.schema.bases[0];
const recordsForBase = () =>
  (state.payload?.records || []).filter((record) => record.baseKey === baseConfig()?.key);
const pageInfoForBase = () => state.payload?.pageInfo?.[baseConfig()?.key] || {};
const loadedCount = (count, hasMore) => `${count}${hasMore ? "+" : ""}`;
const primaryField = () => baseConfig()?.fields?.[0]?.slug || "name";
// Declared per Base in the blueprint (`ui.detail_modes`). The mode decides what
// a row click does; an explicit `/record` path always opens the full page, which
// is how a drawer's "Open full page" and a shared link both land.
const DETAIL_MODES = ["page", "drawer", "split"];
const detailMode = (baseKey = state.activeBase) => {
  const mode = appConfig.ui.detail_modes?.[baseKey];
  return DETAIL_MODES.includes(mode) ? mode : "drawer";
};
const filteredRecords = () => {
  const query = state.query.trim().toLowerCase();
  return query
    ? recordsForBase().filter((record) =>
        JSON.stringify(record.fields).toLowerCase().includes(query),
      )
    : recordsForBase();
};

// The record the detail panel shows: one already paged in, else the one the
// route fetched by id.
const currentRecord = () =>
  recordsForBase().find((item) => item.id === state.selectedRecordId) || state.detailRecord;

const setMobileSidebar = (open) => {
  document.body.classList.toggle("sidebar-open", open);
  byId("sidebarScrim").hidden = !open;
};
const setText = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = value;
};

// A real total (records.count) when it's known, so this badge isn't stuck
// showing "however many happen to be loaded" once a Base has more than one
// page. Falls back to the loaded-so-far "12+" style marker when the count
// was denied or unavailable.
function navCount(base) {
  const total = state.payload?.totalCount?.[base.key];
  if (total != null) return String(total);
  const loaded = (state.payload?.records || []).filter(
    (record) => record.baseKey === base.key,
  ).length;
  return loadedCount(loaded, state.payload?.pageInfo?.[base.key]?.nextCursor);
}

function renderNavigation() {
  const overview = `
    <button class="nav-item ${state.page === "overview" ? "active" : ""}" type="button" data-overview>
      <span>${escapeHtml(messages.overview)}</span>
    </button>`;
  byId("baseNav").innerHTML =
    overview +
    appConfig.schema.bases
      .map(
        (base) => `
    <button class="nav-item ${state.page === "base" && base.key === state.activeBase ? "active" : ""}" type="button" data-base="${escapeHtml(base.key)}">
      <span>${escapeHtml(base.name)}</span>
      <span class="nav-count">${navCount(base)}</span>
    </button>
  `,
      )
      .join("");
}

// A sum of exact per-Base counts (records.count) is itself exact -- unlike a
// sum of a *field* across records (a real aggregate, which no SDK endpoint
// answers without loading everything), this is just addition over numbers
// already known to be correct. Falls back to a loaded-so-far approximation
// only when at least one Base's count was denied/unavailable.
function totalRecordsAcrossBases() {
  const totals = Object.values(state.payload?.totalCount || {});
  if (totals.length === appConfig.schema.bases.length && totals.every((value) => value != null)) {
    return String(totals.reduce((sum, value) => sum + value, 0));
  }
  return loadedCount(
    state.payload?.records?.length || 0,
    Object.values(state.payload?.pageInfo || {}).some((page) => page.nextCursor),
  );
}

function renderMetrics() {
  const pending = (state.payload?.changeRequests || []).filter((request) =>
    ["in_review", "changes_requested", "approved", "conflict"].includes(request.status),
  ).length;
  const metrics = [
    [messages.totalRecords, totalRecordsAcrossBases()],
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

function listColumns(base) {
  const configured = appConfig.ui.list_columns?.[base?.key];
  return configured?.length
    ? configured.map((slug) => base.fields.find((field) => field.slug === slug)).filter(Boolean)
    : (base?.fields || []).slice(0, 4);
}

// One table markup for the record view and the overview previews, so a row
// reads the same wherever it appears.
function recordsTable(base, records, columns) {
  return `
    <table class="records-table">
      <thead><tr>${columns.map((field) => `<th scope="col">${escapeHtml(field.name)}</th>`).join("")}</tr></thead>
      <tbody>${records
        .map(
          (record) => `
        <tr data-base="${escapeHtml(base.key)}" data-record="${escapeHtml(record.id)}" class="${record.id === state.selectedRecordId ? "selected" : ""}">${columns
          .map(
            (field, index) => `
          <td>${
            index === 0
              ? `<a class="record-link" href="${escapeHtml(recordUrl(record.id, base.key))}">${escapeHtml(displayValue(record.fields?.[field.slug]))}</a>`
              : escapeHtml(cellText(field, record.fields?.[field.slug]))
          }</td>
        `,
          )
          .join("")}</tr>
      `,
        )
        .join("")}</tbody>
    </table>`;
}

function renderList() {
  const base = baseConfig();
  const records = filteredRecords();
  const baseTotal = base ? state.payload?.totalCount?.[base.key] : null;
  // The sidebar already prints this Base's total, so on desktop the toolbar
  // count only appears while a search narrows it (see `.searching` in CSS).
  setText(
    "recordCount",
    state.query
      ? String(records.length)
      : baseTotal != null
        ? String(baseTotal)
        : loadedCount(records.length, pageInfoForBase().nextCursor),
  );
  byId("loadMore").hidden = !pageInfoForBase().nextCursor || Boolean(state.query);
  setText("loadMore", messages.loadMore);
  if (!records.length) {
    byId("recordList").innerHTML =
      `<div class="empty-list">${escapeHtml(state.query ? messages.noMatches : messages.noRecords)}</div>`;
    return;
  }
  byId("recordList").innerHTML = recordsTable(base, records, listColumns(base));
}

// Overview previews read only what the initial page already loaded: a few rows
// per Base and a way into the full view. No extra request, no count that the
// sidebar already shows.
function renderOverview() {
  setText("overviewTitle", appConfig.appName);
  setText("overviewSummary", appConfig.ui.summary);
  byId("overviewSections").innerHTML = appConfig.schema.bases
    .map((base) => {
      const records = (state.payload?.records || [])
        .filter((record) => record.baseKey === base.key)
        .slice(0, 5);
      return `
    <section class="card flush overview-section">
      <header class="overview-section-head">
        <h2>${escapeHtml(base.name)}</h2>
        <a href="#/base/${encodeURIComponent(base.key)}">${escapeHtml(messages.viewAll)}</a>
      </header>
      ${
        records.length
          ? recordsTable(base, records, listColumns(base).slice(0, 3))
          : `<div class="empty-list">${escapeHtml(messages.noRecords)}</div>`
      }
    </section>`;
    })
    .join("");
}

function renderDetail() {
  const record = currentRecord();
  byId("detailEmpty").hidden = Boolean(record);
  byId("detailContent").hidden = !record;
  const overlay = state.detailPresentation === "drawer" || state.detailPresentation === "split";
  // On a phone every mode is a page, so the control reads as a way back.
  const phone = window.matchMedia("(max-width: 720px)").matches;
  setText("backButton", overlay && !phone ? messages.close : messages.back);
  byId("backButton").hidden = state.detailPresentation === "split" && !state.selectedRecordId;
  // Drawer and split render the same detail as the full page; this is the way
  // up to it, for a record that turns out to need more room.
  const expand = byId("detailExpand");
  expand.hidden = !overlay || !state.selectedRecordId;
  if (!expand.hidden) {
    expand.href = detailUrl(state.selectedRecordId);
    expand.textContent = messages.openFullPage;
  }
  if (!record) {
    setText(
      "detailEmpty",
      state.selectedRecordId ? state.detailError || messages.loading : messages.selectRecord,
    );
    return;
  }
  const base = baseConfig();
  setText("detailTitle", displayValue(record.fields?.[primaryField()]));
  byId("detailFields").innerHTML = (base?.fields || [])
    .slice(1)
    .map(
      (field) => `
    <div class="field-row"><span>${escapeHtml(field.name)}</span><strong>${escapeHtml(cellText(field, record.fields?.[field.slug]))}</strong></div>
  `,
    )
    .join("");
  renderActions(record);
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

// ── Change-request actions ──────────────────────────────────────────────────
// A blueprint `ui.actions` entry of kind "change_request" is a small, named edit
// of the open record. The write goes through the provider, whose SDK record
// helper never passes `autoMerge`: Busabase merges the change for a viewer with
// write access and queues it as a ChangeRequest for one without. Both are
// correct outcomes, so the notice says which one happened
// (`airAppWriteMessage`) instead of claiming "Saved" for a write that is only
// waiting for someone. A read-only app, and the demo provider, show no actions.
const actionsForBase = () =>
  appConfig.readOnly || typeof state.provider?.updateRecord !== "function"
    ? []
    : (appConfig.ui.actions || []).filter(
        (action) => action.kind === "change_request" && action.base === state.activeBase,
      );

const actionInput = (field, value) => {
  const name = escapeHtml(field.slug);
  if (field.type === "checkbox")
    return `<input name="${name}" type="checkbox"${value === true ? " checked" : ""}>`;
  if (field.type === "select") {
    const choices = field.options?.choices || [];
    return `<select name="${name}"><option value=""></option>${choices
      .map(
        (choice) =>
          `<option value="${escapeHtml(choice.id)}"${choice.id === value ? " selected" : ""}>${escapeHtml(choice.name)}</option>`,
      )
      .join("")}</select>`;
  }
  if (field.type === "longtext" || field.type === "markdown")
    return `<textarea name="${name}" rows="4">${escapeHtml(value ?? "")}</textarea>`;
  return `<input name="${name}" type="${field.type === "number" ? "number" : "text"}" value="${escapeHtml(value ?? "")}" autocomplete="off">`;
};

// What the form holds, in the shape the Base stores; compared with what the
// record holds now so only real changes are proposed.
const formValue = (field, element) => {
  if (field.type === "checkbox") return element.checked;
  if (field.type === "number") return element.value === "" ? null : Number(element.value);
  return element.value;
};
const storedValue = (field, record) => {
  const value = record.fields?.[field.slug];
  if (field.type === "checkbox") return value === true;
  return value ?? (field.type === "number" ? null : "");
};

function renderActions(record) {
  const actions = record ? actionsForBase() : [];
  const bar = byId("detailActions");
  bar.hidden = !actions.length || Boolean(state.activeAction);
  bar.innerHTML = actions
    .map(
      (action) =>
        `<button class="button" type="button" data-action="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`,
    )
    .join("");
  byId("actionForm").hidden = !state.activeAction;
  for (const control of byId("actionForm").querySelectorAll("button, input, select, textarea")) {
    control.disabled = state.saving;
  }
  const notice = byId("detailNotice");
  notice.hidden = !state.notice;
  notice.className = `notice ${state.notice?.tone || ""}`.trim();
  notice.textContent = state.notice?.text || "";
}

function openAction(actionId) {
  const record = currentRecord();
  const action = actionsForBase().find((item) => item.id === actionId);
  if (!record || !action) return;
  state.activeAction = action;
  state.notice = null;
  const fields = action.fields
    .map((slug) => baseConfig().fields.find((field) => field.slug === slug))
    .filter(Boolean);
  byId("actionForm").innerHTML = `
    <h3>${escapeHtml(action.label)}</h3>
    ${fields
      .map(
        (field) => `
    <label class="action-field"><span>${escapeHtml(field.name)}</span>${actionInput(field, record.fields?.[field.slug])}</label>`,
      )
      .join("")}
    <label class="action-field"><span>${escapeHtml(messages.actionNote)}</span><input data-action-note type="text" autocomplete="off"></label>
    <div class="action-buttons">
      <button class="button primary" type="submit">${escapeHtml(messages.actionSubmit)}</button>
      <button class="button" type="button" data-cancel-action>${escapeHtml(messages.actionCancel)}</button>
    </div>`;
  renderActions(record);
  byId("actionForm").querySelector("input, select, textarea")?.focus();
}

function closeAction() {
  state.activeAction = null;
  byId("actionForm").hidden = true;
  byId("actionForm").innerHTML = "";
}

// Read the open record again. The next write is made against the head it was
// read at, and a stale one is refused as a conflict, so this runs after a saved
// write (its head moved) and after a refused one (someone else's change may be
// why).
async function reloadRecord(record) {
  const fresh = await state.provider.getRecord(state.activeBase, record.id);
  const index = state.payload.records.findIndex((item) => item.id === fresh.id);
  if (index >= 0) state.payload.records[index] = fresh;
  else state.detailRecord = fresh;
}

// A saved write changed the record. A queued one changed nothing but the
// pending-review count.
async function refreshAfterWrite(record, outcome) {
  try {
    if (outcome.status === "queued") {
      Object.assign(state.payload, await state.provider.refreshChangeRequests());
      return;
    }
    await reloadRecord(record);
  } catch {
    // The write itself went through and the notice says so; only the screen is
    // behind. Say that too rather than leave the old value looking current.
    state.notice = {
      ...state.notice,
      text: `${state.notice.text} ${messages.actionRefreshFailed}`,
    };
  }
}

async function submitAction(event) {
  event.preventDefault();
  const record = currentRecord();
  const action = state.activeAction;
  if (!record || !action || state.saving) return;
  const form = byId("actionForm");
  const changes = {};
  for (const slug of action.fields) {
    const field = baseConfig().fields.find((item) => item.slug === slug);
    const element = form.elements.namedItem(slug);
    if (!field || !element) continue;
    const next = formValue(field, element);
    if (next !== storedValue(field, record)) changes[slug] = next;
  }
  if (!Object.keys(changes).length) {
    state.notice = { tone: "info", text: messages.actionNoChange };
    renderActions(record);
    return;
  }
  const note = form.querySelector("[data-action-note]").value.trim();
  const title = displayValue(record.fields?.[primaryField()]);
  const message = `${action.label}: ${title}${note ? `. ${note}` : ""}`;
  state.saving = true;
  renderActions(record);
  try {
    const outcome = await state.provider.updateRecord(state.activeBase, record, changes, message);
    state.notice = {
      tone: outcome.status === "queued" ? "info" : "success",
      text: airAppWriteMessage(outcome, { locale: appConfig.locale }),
    };
    closeAction();
    await refreshAfterWrite(record, outcome);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    state.notice = { tone: "error", text: `${messages.actionFailed} ${reason}` };
    // Best effort: the error is the news. A reload that also fails changes nothing.
    await reloadRecord(record).catch(() => {});
  } finally {
    state.saving = false;
    render();
  }
}

// Connection UX Contract gate — `busabase-sdk/airapp-gate`, configured. The
// three screens (connect / choose a Space / initialize the workspace), the
// state machine behind them, and their stylesheet all live in the SDK; only
// this app's name and demo escape hatch are its own. `shouldGate` is passed
// explicitly rather than letting the SDK infer it from a status probe: where
// this app runs is a fact its host states (`BUSABASE_AIRAPP_RUNTIME`,
// surfaced through runtime.js's `getRuntime()`, the SDK's probe), never
// something to guess from the hostname — see runtime.js for why both
// directions of that guess are wrong.
const isDemo = () => new URLSearchParams(window.location.search).get("demo") === "1";

const gate = createAirAppConnectGate({
  appName: appConfig.appName,
  demoHref: "?demo=1",
  shouldGate: () => !isDemo() && shouldUseLocalGateway(state.runtime),
  onProvision: () => {
    throw new Error(
      "This template does not self-provision; resources are created at scaffold time.",
    );
  },
});

function render() {
  const onBase = state.page === "base";
  const presentation = onBase ? state.detailPresentation : null;
  document.body.classList.toggle("detail-open", onBase && Boolean(state.selectedRecordId));
  document.body.classList.toggle("detail-page", presentation === "page");
  document.body.classList.toggle("detail-drawer", presentation === "drawer");
  document.body.classList.toggle(
    "layout-split",
    onBase && detailMode() === "split" && presentation !== "page",
  );
  document.body.classList.toggle("searching", Boolean(state.query));
  document.body.classList.toggle("density-compact", appConfig.ui.density === "compact");
  byId("overviewPage").hidden = onBase;
  byId("viewPage").hidden = !onBase;
  document.documentElement.lang = appConfig.locale;
  document.documentElement.style.setProperty("--accent", appConfig.brand?.accent || "#176B5B");
  document.title = appConfig.appName;
  setText("brandName", appConfig.appName);
  setText("brandDescription", appConfig.description);
  setText("viewTitle", baseConfig()?.name || appConfig.appName);
  setText("mobileTitle", onBase ? baseConfig()?.name || appConfig.appName : appConfig.appName);
  setText("attentionTitle", messages.attentionTitle);
  setText("searchLabel", messages.search);
  byId("searchInput").placeholder = messages.searchPlaceholder;
  setText("settingsOpen", messages.settings);
  setText("settingsEyebrow", messages.settingsEyebrow);
  setText("settingsTitle", messages.settingsTitle);
  renderNavigation();
  renderMetrics();
  if (onBase) {
    renderList();
    renderDetail();
  } else {
    renderOverview();
  }
  renderSettings();
}

const routeQuery = (extra = {}) => {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `?${text}` : "";
};
const listUrl = () => `#/base/${encodeURIComponent(state.activeBase)}${routeQuery()}`;
// The full page: `/record` in the path. Always a page, whatever the Base's mode.
const detailUrl = (recordId, baseKey = state.activeBase) =>
  `#/base/${encodeURIComponent(baseKey)}/${encodeURIComponent(recordId)}${routeQuery()}`;
// What a row opens: the full page for a `page` Base, otherwise the list with
// `?peek=` so the drawer or split pane is just as linkable as the page.
const recordUrl = (recordId, baseKey = state.activeBase) =>
  detailMode(baseKey) === "page"
    ? detailUrl(recordId, baseKey)
    : `#/base/${encodeURIComponent(baseKey)}${routeQuery({ peek: recordId })}`;

async function syncRoute() {
  const serial = ++routeSerial;
  const match = /^#\/base\/([^/?]+)(?:\/([^?]+))?(?:\?(.*))?$/.exec(window.location.hash);
  const params = new URLSearchParams(match?.[3] || "");
  let candidate = appConfig.ui.primary_base;
  let pathRecord = null;
  try {
    if (match) candidate = decodeURIComponent(match[1]);
    if (match?.[2]) pathRecord = decodeURIComponent(match[2]);
  } catch {
    candidate = appConfig.ui.primary_base;
  }
  // No Base in the hash (first load, `#/overview`, anything unknown) is the overview.
  state.page = match ? "base" : "overview";
  state.activeBase = appConfig.schema.bases.some((base) => base.key === candidate)
    ? candidate
    : appConfig.ui.primary_base;
  const peek = detailMode() === "page" ? null : params.get("peek");
  const recordId = pathRecord || peek || null;
  state.selectedRecordId = state.page === "base" ? recordId : null;
  state.detailPresentation = pathRecord ? "page" : detailMode() === "page" ? null : detailMode();
  // Mark a detail entry opened from the list, so "Back to list" can step back
  // to that entry instead of pushing a new one the browser's Back would undo.
  if (recordId && previousRouteWasList) history.replaceState({ fromList: true }, "");
  previousRouteWasList = state.page === "base" && !recordId;
  state.detailRecord = null;
  closeAction();
  state.notice = null;
  state.query = params.get("q") || "";
  state.detailError = "";
  byId("searchInput").value = state.query;
  setMobileSidebar(false);
  render();
  if (
    !state.selectedRecordId ||
    recordsForBase().some((record) => record.id === state.selectedRecordId)
  )
    return;
  try {
    const record = await state.provider.getRecord(state.activeBase, state.selectedRecordId);
    if (serial !== routeSerial) return;
    state.detailRecord = record;
  } catch {
    if (serial !== routeSerial) return;
    state.detailError = messages.recordUnavailable;
  }
  render();
}

async function load() {
  setText("loadingState", messages.loading);
  byId("errorState").hidden = true;
  // Resolved before the first data call so a failure can be explained in terms
  // of where this app actually runs. It must never gate the call itself: the
  // runtime decides what to TELL the user, the API decides what is possible.
  state.runtime = await getRuntime();
  // A hosted-only app (a Python host has no OAuth gateway) run standalone cannot
  // get a credential, and the gate cannot tell it so: with no /auth/status to read
  // it assumes a hosted origin and lets the app call /api/v1 with nothing, which
  // ends in a bare "Not Found". Say what is true instead.
  if (appConfig.hostedOnly && state.runtime.determined && !state.runtime.hosted && !isDemo()) {
    setText("loadingState", "");
    byId("errorState").hidden = false;
    setText("errorState", messages.hostedOnly);
    return;
  }
  try {
    const ready = await gate.pass({ onReady: load });
    if (!ready) {
      setText("loadingState", "");
      return;
    }
    // Only a standalone run has a gateway to ask. A hosted app never calls /auth/*:
    // Busabase owns /api/v1 there, and the answer would be about nothing.
    state.authStatus =
      !isDemo() && shouldUseLocalGateway(state.runtime) ? await gate.status() : null;
    state.provider = await getProvider();
    state.payload = await state.provider.getState();
    setText("loadingState", "");
    await syncRoute();
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
  const button = event.target.closest("[data-base], [data-overview]");
  if (!button) return;
  window.location.hash =
    "overview" in button.dataset
      ? "#/overview"
      : `#/base/${encodeURIComponent(button.dataset.base)}`;
  setMobileSidebar(false);
});

// The whole row opens the record, not just its first cell. The link inside the
// first cell stays so keyboard, middle-click and "copy link" keep working.
const openRow = (event) => {
  const row = event.target.closest("tr[data-record]");
  if (!row || event.target.closest("a, button, input")) return;
  window.location.hash = recordUrl(row.dataset.record, row.dataset.base);
};
byId("recordList").addEventListener("click", openRow);
byId("overviewSections").addEventListener("click", openRow);

byId("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${listUrl()}`,
  );
  document.body.classList.toggle("searching", Boolean(state.query));
  renderList();
});
byId("loadMore").addEventListener("click", loadMore);
byId("sidebarOpen").addEventListener("click", () => setMobileSidebar(true));
byId("sidebarClose").addEventListener("click", () => setMobileSidebar(false));
byId("sidebarScrim").addEventListener("click", () => setMobileSidebar(false));
byId("backButton").addEventListener("click", () => {
  if (history.state?.fromList) history.back();
  else window.location.hash = listUrl();
});
byId("detailActions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) openAction(button.dataset.action);
});
byId("actionForm").addEventListener("submit", submitAction);
byId("actionForm").addEventListener("click", (event) => {
  if (!event.target.closest("[data-cancel-action]")) return;
  closeAction();
  renderActions(currentRecord());
});
window.addEventListener("hashchange", () => {
  if (state.payload) syncRoute();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !byId("settingsModal").hidden) return;
  if (state.selectedRecordId && state.detailPresentation !== "page") byId("backButton").click();
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
  }
});

load();
