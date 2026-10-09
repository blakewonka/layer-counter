import { test } from "node:test";
import assert from "node:assert/strict";

// src/plugin/main.ts runs against the `figma` global as soon as it is
// imported, so each test installs a stub first and then imports a fresh module
// instance (a different query string gives a distinct module URL).
const MAIN_URL = new URL("../src/plugin/main.ts", import.meta.url).href;
let instance = 0;

type Posted = { type: string; message?: unknown };
type StubOptions = {
  stored?: unknown;
  rejectGetAsync?: boolean;
  rejectSetAsync?: boolean;
};

function installFigma(options: StubOptions = {}) {
  const posted: Posted[] = [];
  const handlers: Record<string, Array<() => void>> = {};
  const setAsyncCalls: Array<[string, unknown]> = [];
  const showUICalls: unknown[][] = [];
  const notifications: string[] = [];
  const figma = {
    showUI: (...args: unknown[]) => {
      showUICalls.push(args);
    },
    on: (event: string, handler: () => void) => {
      (handlers[event] ??= []).push(handler);
    },
    ui: {
      postMessage: (message: Posted) => {
        posted.push(message);
      },
      onmessage: undefined as undefined | ((message: unknown) => unknown),
    },
    clientStorage: {
      getAsync: async (key: string) => {
        assert.equal(key, "shouldCountChildren");
        if (options.rejectGetAsync) throw new Error("storage unavailable");
        return options.stored;
      },
      setAsync: async (key: string, value: unknown) => {
        setAsyncCalls.push([key, value]);
        if (options.rejectSetAsync) throw new Error("storage unavailable");
      },
    },
    currentPage: { selection: [] as unknown[] },
    notify: (message: string) => {
      notifications.push(message);
    },
    viewport: { scrollAndZoomIntoView: () => {} },
  };
  Object.assign(globalThis, { figma, __html__: "<html></html>" });
  return { figma, posted, handlers, setAsyncCalls, showUICalls, notifications };
}

type Stub = ReturnType<typeof installFigma>;

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function loadMain(options?: StubOptions): Promise<Stub> {
  const stub = installFigma(options);
  await import(`${MAIN_URL}?instance=${++instance}`);
  await settle(); // let the stored setting resolve
  return stub;
}

function send(stub: Stub, message: unknown) {
  assert.ok(stub.figma.ui.onmessage, "main.ts must assign figma.ui.onmessage");
  return stub.figma.ui.onmessage(message);
}

function select(stub: Stub, ...nodes: unknown[]) {
  stub.figma.currentPage.selection = nodes;
}

const selectionChanged = (stub: Stub) => stub.handlers.selectionchange[0]();
const pageChanged = (stub: Stub) => stub.handlers.currentpagechange[0]();

const frameWithText = { type: "FRAME", findAll: () => [{ type: "TEXT" }] };

test("showUI is called once with the bundled html and the fixed window options", async () => {
  const stub = await loadMain();
  assert.deepEqual(stub.showUICalls, [
    ["<html></html>", { width: 240, height: 360, themeColors: true }],
  ]);
});

test("nothing is posted before uiReady, even though the setting resolved earlier", async () => {
  const stub = await loadMain();
  select(stub, frameWithText);
  selectionChanged(stub);
  pageChanged(stub);
  assert.deepEqual(stub.posted, []);
});

test("uiReady yields exactly one shouldCountChildren then one updateCounts", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  assert.deepEqual(stub.posted, [
    { type: "shouldCountChildren", message: true },
    { type: "updateCounts", message: {} },
  ]);
});

test("uiReady reports the current selection, counted with the stored setting", async () => {
  const stub = await loadMain({ stored: false });
  select(stub, frameWithText);
  await send(stub, { type: "uiReady" });
  assert.deepEqual(stub.posted, [
    { type: "shouldCountChildren", message: false },
    { type: "updateCounts", message: { FRAME: 1 } },
  ]);
});

test("a stored false setting is reported as false, with no earlier true message", async () => {
  const stub = await loadMain({ stored: false });
  await send(stub, { type: "uiReady" });
  assert.deepEqual(
    stub.posted.filter((m) => m.type === "shouldCountChildren"),
    [{ type: "shouldCountChildren", message: false }],
  );
});

test("a rejected getAsync falls back to true", async () => {
  const stub = await loadMain({ rejectGetAsync: true });
  await send(stub, { type: "uiReady" });
  assert.deepEqual(stub.posted[0], {
    type: "shouldCountChildren",
    message: true,
  });
});

test("a stored non-boolean value falls back to true", async () => {
  const stub = await loadMain({ stored: "yes" });
  await send(stub, { type: "uiReady" });
  assert.deepEqual(stub.posted[0], {
    type: "shouldCountChildren",
    message: true,
  });
});

test("the selectionchange handler posts updateCounts for the current selection", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, frameWithText);
  const before = stub.posted.length;
  selectionChanged(stub);
  assert.deepEqual(stub.posted.slice(before), [
    { type: "updateCounts", message: { FRAME: 1, TEXT: 1 } },
  ]);
});

test("the currentpagechange handler posts updateCounts too", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, { type: "RECTANGLE" });
  const before = stub.posted.length;
  pageChanged(stub);
  assert.deepEqual(stub.posted.slice(before), [
    { type: "updateCounts", message: { RECTANGLE: 1 } },
  ]);
});

test("a selection change that leaves the counts identical posts nothing", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, frameWithText);
  selectionChanged(stub);
  const before = stub.posted.length;
  select(stub, { ...frameWithText }); // a different node with the same shape
  selectionChanged(stub);
  pageChanged(stub);
  assert.deepEqual(stub.posted.slice(before), []);
});

test("a changed selection posts exactly once", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, frameWithText);
  selectionChanged(stub);
  const before = stub.posted.length;
  select(stub, frameWithText, { type: "TEXT" });
  selectionChanged(stub);
  assert.deepEqual(stub.posted.slice(before), [
    { type: "updateCounts", message: { FRAME: 1, TEXT: 2 } },
  ]);
});

test("the same counts in a different key order are posted (order is part of the contract)", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, { type: "TEXT" }, { type: "FRAME", findAll: () => [] });
  selectionChanged(stub);
  const before = stub.posted.length;
  select(stub, { type: "FRAME", findAll: () => [] }, { type: "TEXT" });
  selectionChanged(stub);
  assert.deepEqual(stub.posted.slice(before), [
    { type: "updateCounts", message: { FRAME: 1, TEXT: 1 } },
  ]);
  assert.deepEqual(
    Object.keys(stub.posted[stub.posted.length - 1].message as object),
    ["FRAME", "TEXT"],
  );
});

test("toggleCountChildren persists the setting and re-posts the counts", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, frameWithText);
  selectionChanged(stub);
  const before = stub.posted.length;
  await send(stub, { type: "toggleCountChildren", message: false });
  assert.deepEqual(stub.setAsyncCalls, [["shouldCountChildren", false]]);
  assert.deepEqual(stub.posted.slice(before), [
    { type: "updateCounts", message: { FRAME: 1 } },
  ]);
});

test("toggling to the same value posts nothing new", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  select(stub, frameWithText);
  selectionChanged(stub);
  const before = stub.posted.length;
  await send(stub, { type: "toggleCountChildren", message: true });
  assert.deepEqual(stub.setAsyncCalls, [["shouldCountChildren", true]]);
  assert.deepEqual(stub.posted.slice(before), []);
});

test("a failing setAsync is swallowed", async () => {
  const stub = await loadMain({ rejectSetAsync: true });
  await send(stub, { type: "uiReady" });
  await send(stub, { type: "toggleCountChildren", message: false });
  await settle(); // an unhandled rejection here would fail the run
  assert.deepEqual(stub.setAsyncCalls, [["shouldCountChildren", false]]);
});

test("exportToCanvas uses the plugin's own counts, not the UI payload", async () => {
  const stub = await loadMain();
  await send(stub, { type: "uiReady" });
  // Nothing is selected, so whatever the UI claims there is nothing to export.
  await send(stub, {
    type: "exportToCanvas",
    message: { counts: { FRAME: 3 }, total: 3 },
  });
  assert.deepEqual(stub.notifications, ["Select layers first"]);
});
