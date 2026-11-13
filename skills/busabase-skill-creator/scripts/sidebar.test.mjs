import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../assets/airapp-template/app/js/sidebar.js", import.meta.url),
  "utf8",
);
const { messages } = await import(
  new URL("../assets/airapp-template/app/js/messages.js", import.meta.url)
);

function fixture(isPhone = false) {
  const listeners = new Map();
  const elements = new Map();
  const classes = new Set();
  const document = {
    activeElement: null,
    body: {
      classList: {
        toggle(name, enabled) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        },
      },
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    getElementById(id) {
      if (!elements.has(id)) {
        const handlers = new Map();
        const attributes = new Map();
        const element = {
          hidden: true,
          addEventListener(name, handler) {
            handlers.set(name, handler);
          },
          setAttribute(name, value) {
            attributes.set(name, value);
          },
          getAttribute(name) {
            return attributes.get(name);
          },
          focus() {
            document.activeElement = element;
          },
          click() {
            element.focus();
            handlers.get("click")();
          },
        };
        elements.set(id, element);
      }
      return elements.get(id);
    },
  };
  let mediaChange;
  const phone = {
    matches: isPhone,
    addEventListener(name, handler) {
      assert.equal(name, "change");
      mediaChange = handler;
    },
  };
  const closeMobileSidebar = vm.runInNewContext(
    source.replace("export function", "function") + "\nsetupSidebar(messages);",
    { document, window: { matchMedia: () => phone }, messages },
  );
  return {
    classes,
    document,
    open: elements.get("sidebarOpen"),
    panel: elements.get("sidebarClose"),
    scrim: elements.get("sidebarScrim"),
    closeMobileSidebar,
    resize(isPhone) {
      phone.matches = isPhone;
      mediaChange();
    },
    escape() {
      const event = {
        key: "Escape",
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      listeners.get("keydown")(event);
      return event;
    },
  };
}

test("desktop navigation collapses and expands without a mobile scrim", () => {
  const sidebar = fixture();
  assert.equal(sidebar.panel.getAttribute("aria-expanded"), "true");
  assert.equal(sidebar.panel.title, messages.collapseNavigation);
  sidebar.panel.click();
  assert.ok(sidebar.classes.has("sidebar-collapsed"));
  assert.ok(!sidebar.classes.has("sidebar-open"));
  assert.equal(sidebar.scrim.hidden, true);
  assert.equal(sidebar.panel.getAttribute("aria-expanded"), "false");
  assert.equal(sidebar.panel.getAttribute("aria-label"), messages.expandNavigation);
  assert.equal(sidebar.document.activeElement, sidebar.panel);
  sidebar.closeMobileSidebar();
  assert.ok(sidebar.classes.has("sidebar-collapsed"));
  sidebar.panel.click();
  assert.ok(!sidebar.classes.has("sidebar-collapsed"));
  assert.equal(sidebar.panel.title, messages.collapseNavigation);
  assert.equal(sidebar.panel.getAttribute("aria-expanded"), "true");
  assert.equal(sidebar.escape().defaultPrevented, false);
});

test("phone navigation closes from its button, scrim, Escape, or navigation", () => {
  for (const close of [
    (sidebar) => sidebar.panel.click(),
    (sidebar) => sidebar.scrim.click(),
    (sidebar) => assert.equal(sidebar.escape().defaultPrevented, true),
    (sidebar) => sidebar.closeMobileSidebar(),
  ]) {
    const sidebar = fixture(true);
    assert.equal(sidebar.open.getAttribute("aria-expanded"), "false");
    sidebar.open.click();
    assert.ok(sidebar.classes.has("sidebar-open"));
    assert.equal(sidebar.scrim.hidden, false);
    assert.equal(sidebar.open.getAttribute("aria-expanded"), "true");
    assert.equal(sidebar.panel.title, messages.closeNavigation);
    assert.equal(sidebar.document.activeElement, sidebar.panel);
    close(sidebar);
    assert.ok(!sidebar.classes.has("sidebar-open"));
    assert.ok(!sidebar.classes.has("sidebar-collapsed"));
    assert.equal(sidebar.scrim.hidden, true);
    assert.equal(sidebar.open.getAttribute("aria-expanded"), "false");
    assert.equal(sidebar.document.activeElement, sidebar.open);
  }
});

test("crossing the breakpoint resets the drawer while keeping the desktop choice", () => {
  for (const collapsed of [false, true]) {
    const sidebar = fixture();
    if (collapsed) sidebar.panel.click();
    sidebar.resize(true);
    assert.equal(sidebar.panel.title, messages.closeNavigation);
    sidebar.open.click();
    sidebar.resize(false);
    assert.ok(!sidebar.classes.has("sidebar-open"));
    assert.equal(sidebar.scrim.hidden, true);
    assert.equal(sidebar.classes.has("sidebar-collapsed"), collapsed);
    assert.equal(sidebar.panel.getAttribute("aria-expanded"), String(!collapsed));
    sidebar.resize(true);
    assert.equal(sidebar.open.getAttribute("aria-expanded"), "false");
    sidebar.open.focus();
    sidebar.resize(false);
    assert.equal(sidebar.document.activeElement, sidebar.panel);
  }
});
