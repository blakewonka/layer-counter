// UI entry point. The static markup lives in index.html; this module fills in
// the counts, keeps the row list in sync and relays events to the plugin.
// Plain DOM, no framework: the whole UI is a handful of elements.

import "./styles.css";
import {
  entriesOf,
  totalOf,
  typeLabel,
  type TypeCounts,
} from "../shared/counts.ts";
import type {
  PluginToUiMessage,
  UiToPluginMessage,
} from "../shared/messages.ts";
import { icon } from "./icons.ts";
import { compareUiRows } from "./sort.ts";

const totalEl = byId("total");
const exportBtn = byId<HTMLButtonElement>("export");
const emptyEl = byId("empty");
const listEl = byId("list");
const nested = byId<HTMLInputElement>("nested");

type Row = { el: HTMLElement; value: HTMLElement };
const rows = new Map<string, Row>();

// How long the export button stays dimmed after a click. Visual feedback
// only; the plugin side has the real one-export-at-a-time guard.
const EXPORT_FEEDBACK_MS = 1200;

let current: TypeCounts = {};
let total = 0;
let exporting = false;

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`index.html has no element with id "${id}"`);
  return el as T;
}

function post(m: UiToPluginMessage): void {
  parent.postMessage({ pluginMessage: m }, "*");
}

function element(tag: string, className: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function createRow(type: string): Row {
  const el = element("div", "count-row");
  const iconEl = element("span", "count-icon");
  // innerHTML, not createElement("svg"): the latter would make an HTML element,
  // not an SVG one.
  iconEl.innerHTML = icon(type);
  const typeEl = element("span", "count-type");
  typeEl.textContent = typeLabel(type);
  const value = element("span", "count-value");
  el.append(iconEl, typeEl, value);
  return { el, value };
}

// The plugin only posts counts that changed, so every call here does work.
function render(counts: TypeCounts): void {
  current = counts;
  total = totalOf(counts);

  const entries = entriesOf(counts).sort(compareUiRows);

  totalEl.textContent = String(total);
  exportBtn.hidden = total === 0;
  emptyEl.hidden = total !== 0;
  listEl.hidden = total === 0;

  // Reuse existing rows, moving them only when their position changed.
  const present = new Set<string>();
  entries.forEach(([type, count], i) => {
    present.add(type);
    let row = rows.get(type);
    if (!row) {
      row = createRow(type);
      rows.set(type, row);
    }
    const text = String(count);
    if (row.value.textContent !== text) row.value.textContent = text;
    if (listEl.children[i] !== row.el) {
      listEl.insertBefore(row.el, listEl.children[i] ?? null);
    }
  });
  for (const [type, row] of rows) {
    if (!present.has(type)) {
      row.el.remove();
      rows.delete(type);
    }
  }
}

nested.addEventListener("change", () => {
  post({ type: "toggleCountChildren", message: nested.checked });
});

exportBtn.addEventListener("click", () => {
  if (exporting) return;
  exporting = true;
  exportBtn.classList.add("exporting");
  post({ type: "exportToCanvas", message: { counts: current, total } });
  setTimeout(() => {
    exporting = false;
    exportBtn.classList.remove("exporting");
  }, EXPORT_FEEDBACK_MS);
});

window.addEventListener("message", (event: MessageEvent) => {
  // Ignore messages that don't come from the plugin (Figma internals, extensions, etc.)
  const m: PluginToUiMessage | undefined =
    event.data && event.data.pluginMessage;
  if (!m) return;
  if (m.type === "shouldCountChildren") nested.checked = m.message;
  else if (m.type === "updateCounts") render(m.message || {});
});

post({ type: "uiReady" });
