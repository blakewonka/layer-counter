import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON_PATHS } from "../src/plugin/iconPaths.ts";

// exportCard.ts keeps module state (the font cache and the in-flight guard),
// so each test installs a fresh figma stub and imports a fresh module instance.
const MODULE_URL = new URL("../src/plugin/exportCard.ts", import.meta.url).href;
let instance = 0;

// ── Recording stand-ins for Figma nodes ─────────────────────────────────────
// Text is measured deterministically: 6px per character, 13px tall.

type FakeNode = {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: FakeNode[];
  parent: FakeNode | null;
  removed: boolean;
  resize(width: number, height: number): void;
  appendChild(child: FakeNode): void;
  remove(): void;
  [property: string]: unknown;
};

function makeNode(type: string): FakeNode {
  const node: FakeNode = {
    type,
    name: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    children: [],
    parent: null,
    removed: false,
    resize(width, height) {
      node.width = width;
      node.height = height;
    },
    appendChild(child) {
      if (child.parent) {
        const siblings = child.parent.children;
        siblings.splice(siblings.indexOf(child), 1);
      }
      child.parent = node;
      node.children.push(child);
    },
    remove() {
      node.removed = true;
      if (node.parent) {
        const siblings = node.parent.children;
        siblings.splice(siblings.indexOf(node), 1);
      }
    },
  };
  if (type === "TEXT") {
    let characters = "";
    Object.defineProperty(node, "characters", {
      enumerable: true,
      get: () => characters,
      set: (value: string) => {
        assert.ok(node.fontName, "fontName must be set before characters");
        characters = value;
        node.width = value.length * 6;
        node.height = 13;
      },
    });
  }
  return node;
}

type Deferred = { resolve: () => void; reject: (error: Error) => void };

type StubOptions = {
  fontError?: Error;
  deferFonts?: boolean;
  throwOn?: "FRAME" | "TEXT" | "VECTOR" | "LINE"; // figma.create* for this node type throws
};

function installFigma(options: StubOptions = {}) {
  const created: FakeNode[] = [];
  const notifications: Array<[string, unknown]> = [];
  const fontCalls: Array<{ family: string; style: string }> = [];
  const pendingFonts: Deferred[] = [];
  const page = makeNode("PAGE");
  const create = (type: string) => {
    if (options.throwOn === type) throw new Error(`cannot create ${type}`);
    const node = makeNode(type);
    created.push(node);
    return node;
  };
  const figma = {
    currentPage: Object.assign(page, { selection: [] as FakeNode[] }),
    notify: (message: string, notifyOptions?: unknown) => {
      notifications.push([message, notifyOptions]);
    },
    viewport: {
      scrolledTo: null as FakeNode[] | null,
      scrollAndZoomIntoView(nodes: FakeNode[]) {
        figma.viewport.scrolledTo = nodes;
      },
    },
    loadFontAsync: (font: { family: string; style: string }) => {
      fontCalls.push(font);
      if (options.fontError) return Promise.reject(options.fontError);
      if (options.deferFonts) {
        return new Promise<void>((resolve, reject) =>
          pendingFonts.push({ resolve, reject }),
        );
      }
      return Promise.resolve();
    },
    createFrame: () => create("FRAME"),
    createText: () => create("TEXT"),
    createVector: () => create("VECTOR"),
    createLine: () => create("LINE"),
  };
  Object.assign(globalThis, { figma });
  return {
    figma,
    page,
    created,
    notifications,
    fontCalls,
    pendingFonts,
    options,
  };
}

async function load(options?: StubOptions) {
  const stub = installFigma(options);
  const mod = await import(`${MODULE_URL}?instance=${++instance}`);
  const exportToCanvas: (counts: Record<string, number>) => Promise<void> =
    mod.exportToCanvas;
  return { ...stub, exportToCanvas };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const box = (node: FakeNode) => [
  node.type,
  node.name,
  node.x,
  node.y,
  node.width,
  node.height,
];
const opacity = (node: FakeNode) =>
  (node.fills as Array<{ opacity: number }>).map((f) => f.opacity);
const label = (node: FakeNode) => (node.type === "LINE" ? "LINE" : node.name);

test("builds the card for { FRAME: 2, TEXT: 1 }", async () => {
  const stub = await load();
  await stub.exportToCanvas({ FRAME: 2, TEXT: 1 });

  assert.deepEqual(stub.notifications, []);
  assert.deepEqual(
    stub.fontCalls.map((f) => `${f.family} ${f.style}`),
    ["Inter Regular", "Inter Medium", "Inter Semi Bold"],
  );

  assert.equal(stub.page.children.length, 1);
  const card = stub.page.children[0];
  assert.equal(card.name, "Layer Counter");
  assert.deepEqual([card.width, card.height], [240, 40 + 1 + 2 * 30 + 8]);
  assert.deepEqual(card.children.map(label), [
    "Header",
    "LINE",
    "Frame",
    "Text",
  ]);

  const [header, divider, frameRow, textRow] = card.children;
  assert.equal(divider.y, 40);
  assert.deepEqual([frameRow.y, textRow.y], [45, 75]);
  assert.deepEqual([frameRow.height, textRow.height], [30, 30]);

  const icon = frameRow.children[0];
  assert.deepEqual(
    [icon.name, icon.x, icon.y, icon.width, icon.height],
    ["Icon", 14, 5, 20, 20],
  );
  const glyph = icon.children[0];
  assert.deepEqual(
    [glyph.type, glyph.width, glyph.height, glyph.x, glyph.y],
    ["VECTOR", 16, 16, 2, 2],
  );
  assert.deepEqual(glyph.vectorPaths, [
    { windingRule: "EVENODD", data: ICON_PATHS.FRAME },
  ]);

  const badge = header.children.find((c) => c.name === "Badge");
  assert.ok(badge, "the badge lives in the header");
  assert.equal(badge.parent, header);
  assert.deepEqual(
    badge.children.map((c) => c.characters),
    ["3"],
  );
  assert.deepEqual([badge.children[0].x, badge.children[0].y], [8, 3]);

  assert.deepEqual(
    frameRow.children.map((c) => c.characters ?? c.name),
    ["Icon", "Frame", "2"],
  );
  assert.deepEqual(
    textRow.children.map((c) => c.characters ?? c.name),
    ["Icon", "Text", "1"],
  );

  assert.deepEqual(stub.page.selection, [card]);
  assert.deepEqual(stub.figma.viewport.scrolledTo, [card]);
});

test("every node in creation order: ties keep key order, a type without an icon gets no vector", async () => {
  const stub = await load();
  stub.page.selection = [
    {
      type: "FRAME",
      absoluteBoundingBox: { x: 10, y: 20, width: 100, height: 50 },
    } as unknown as FakeNode,
    { type: "TEXT", absoluteBoundingBox: null } as unknown as FakeNode,
  ];
  await stub.exportToCanvas({ RECTANGLE: 1, TEXT: 3, STICKY: 1, FRAME: 2 }); // total 7, two ties

  // [type, name, x, y, width, height] of every created node, in creation
  // order. Rows are sorted by count only, so RECTANGLE (first in key order)
  // comes before STICKY; STICKY has no icon path, so its tile holds no vector.
  const row = (name: string, y: number, count: string, withIcon = true) => [
    ["FRAME", name, 0, y, 240, 30],
    ["FRAME", "Icon", 14, 5, 20, 20],
    ...(withIcon ? [["VECTOR", "", 2, 2, 16, 16]] : []),
    ["TEXT", "", 50, 8.5, name.length * 6, 13],
    ["TEXT", "", 240 - 14 - count.length * 6, 8.5, count.length * 6, 13],
  ];
  assert.deepEqual(stub.created.map(box), [
    ["FRAME", "Layer Counter", 150, 20, 240, 40 + 1 + 4 * 30 + 8],
    ["FRAME", "Header", 0, 0, 240, 40],
    ["TEXT", "", 14, 13.5, 90, 13], // "Selected Layers"
    ["TEXT", "", 8, 3, 6, 13], // "7", moved into the badge
    ["FRAME", "Badge", 240 - 14 - 22, (40 - 19) / 2, 22, 19],
    ["LINE", "", 0, 40, 240, 0],
    ...row("Text", 45, "3"),
    ...row("Frame", 75, "2"),
    ...row("Rectangle", 105, "1"),
    ...row("Sticky", 135, "1", false),
  ]);

  const card = stub.created[0];
  assert.deepEqual(stub.page.children, [card]);
  assert.deepEqual(card.children.map(label), [
    "Header",
    "LINE",
    "Text",
    "Frame",
    "Rectangle",
    "Sticky",
  ]);
  const header = card.children[0];
  assert.deepEqual(
    header.children.map((c) => c.type + ":" + c.name),
    ["TEXT:", "FRAME:Badge"],
  );
  assert.deepEqual(
    header.children[1].children.map((c) => c.characters),
    ["7"],
  );
  assert.deepEqual(
    card.children.slice(2).map((r) => r.children[1].characters),
    ["Text", "Frame", "Rectangle", "Sticky"],
  );
  assert.deepEqual(
    card.children.slice(2).map((r) => r.children[2].characters),
    ["3", "2", "1", "1"],
  );

  // Alternate rows are tinted
  assert.deepEqual(card.children.slice(2).map(opacity), [
    [],
    [0.02],
    [],
    [0.02],
  ]);
  assert.deepEqual(opacity(card), [1]);
  assert.equal(card.cornerRadius, 10);
  assert.deepEqual(stub.created[2].fontName, {
    family: "Inter",
    style: "Semi Bold",
  });
  assert.equal(stub.created[2].fontSize, 11);
});

test("with nothing selected the card goes to (100, 100)", async () => {
  const stub = await load();
  await stub.exportToCanvas({ TEXT: 1 });
  assert.deepEqual(box(stub.created[0]), [
    "FRAME",
    "Layer Counter",
    100,
    100,
    240,
    40 + 1 + 30 + 8,
  ]);
});

test("a selection without bounding boxes also falls back to (100, 100)", async () => {
  const stub = await load();
  stub.page.selection = [
    { type: "TEXT", absoluteBoundingBox: null } as unknown as FakeNode,
  ];
  await stub.exportToCanvas({ TEXT: 1 });
  assert.deepEqual([stub.created[0].x, stub.created[0].y], [100, 100]);
});

test("zero counts: notifies and creates nothing", async () => {
  const stub = await load();
  await stub.exportToCanvas({});
  assert.deepEqual(stub.notifications, [["Select layers first", undefined]]);
  assert.deepEqual(stub.created, []);
  assert.deepEqual(stub.fontCalls, []);
});

test("fonts are requested in parallel and only once per plugin run", async () => {
  const stub = await load({ deferFonts: true });
  const first = stub.exportToCanvas({ TEXT: 1 });
  await settle();
  // All three requests are in flight before any of them resolved.
  assert.equal(stub.fontCalls.length, 3);
  stub.pendingFonts.forEach((d) => d.resolve());
  await first;
  assert.equal(stub.created.length > 0, true);

  stub.options.deferFonts = false;
  await stub.exportToCanvas({ TEXT: 2 });
  assert.equal(stub.fontCalls.length, 3);
});

test("a font failure is reported and retried on the next export", async () => {
  const stub = await load({ fontError: new Error("no Inter") });
  await stub.exportToCanvas({ TEXT: 1 });
  assert.deepEqual(stub.notifications, [
    ["Export failed: no Inter", { error: true }],
  ]);
  assert.deepEqual(stub.created, []);
  assert.equal(stub.fontCalls.length, 3);

  stub.options.fontError = undefined;
  await stub.exportToCanvas({ TEXT: 1 });
  assert.equal(stub.fontCalls.length, 6);
  assert.equal(stub.notifications.length, 1);
  assert.equal(stub.page.children.length, 1);
});

test("a throw mid-build removes the card and notifies with error: true", async () => {
  const stub = await load({ throwOn: "LINE" });
  await stub.exportToCanvas({ TEXT: 1 });
  assert.deepEqual(stub.notifications, [
    ["Export failed: cannot create LINE", { error: true }],
  ]);
  const card = stub.created[0];
  assert.equal(card.name, "Layer Counter");
  assert.equal(card.removed, true);
  assert.deepEqual(stub.page.children, []);
  assert.deepEqual(stub.page.selection, []);

  // The guard is released, so the next export works.
  stub.options.throwOn = undefined;
  await stub.exportToCanvas({ TEXT: 1 });
  assert.equal(stub.page.children.length, 1);
});

test("an export requested while one is in flight is ignored", async () => {
  const stub = await load({ deferFonts: true });
  const first = stub.exportToCanvas({ TEXT: 1 });
  // The font promise is still unresolved here.
  const second = stub.exportToCanvas({ TEXT: 1 });
  await second; // returns immediately
  assert.equal(stub.created.length, 0);
  assert.equal(stub.fontCalls.length, 3); // no second round of font requests either

  stub.pendingFonts.forEach((d) => d.resolve());
  await first;
  assert.equal(stub.page.children.length, 1);

  // The guard is released afterwards.
  stub.options.deferFonts = false;
  await stub.exportToCanvas({ TEXT: 1 });
  assert.equal(stub.page.children.length, 2);
});
