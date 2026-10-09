import {
  entriesOf,
  typeLabel,
  totalOf,
  type TypeCounts,
} from "../shared/counts.ts";
import { ICON_PATHS } from "./iconPaths.ts";

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

const CARD_W = 240;
const PAD_X = 14; // inset of the header label, badge, icon tile and count from the card edges
const HEADER_H = 40;
const DIVIDER_H = 1;
const ROW_H = 30;
const LIST_PAD = 4; // above the first row and below the last
const ICON_SIZE = 20; // the icon tile
const GLYPH_SIZE = 16; // the vector glyph inside the tile
const GLYPH_INSET = 2;
const LABEL_GAP = 16; // between the icon tile and the type label
const BADGE_PX = 8;
const BADGE_PY = 3;
const FONT_SIZE = 11;
const GAP_FROM_SELECTION = 40;
const FALLBACK_ORIGIN = { x: 100, y: 100 }; // when nothing selected has a bounding box
const CARD_RADIUS = 10;
const BADGE_RADIUS = 5;
const ICON_RADIUS = 4;

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 1, g: 1, b: 1 };
const BADGE_GREY = { r: 0.957, g: 0.957, b: 0.957 };

const FONT_FAMILY = "Inter";
const FONT_STYLES = ["Regular", "Medium", "Semi Bold"];

type Row = [SceneNode["type"], number];

function solid(color: RGB, opacity: number = 1): SolidPaint {
  return { type: "SOLID", color, opacity };
}

// Row order on the canvas card: count descending only. Array.prototype.sort
// is stable, so ties keep the key order of the TypeCounts object.
export function byCountDesc(
  [, a]: readonly [string, number],
  [, b]: readonly [string, number],
): number {
  return b - a;
}

// ─────────────────────────────────────────────────────────────
// Placement and fonts
// ─────────────────────────────────────────────────────────────

// The union of the selected nodes' bounding boxes; null when none has one.
function getSelectionBounds(nodes: readonly SceneNode[]): Rect | null {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let found = false;
  for (const node of nodes) {
    const b = node.absoluteBoundingBox;
    if (!b) continue;
    found = true;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return found
    ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    : null;
}

// To the right of the selection, or at the fallback origin when nothing is
// selected (or nothing selected has a bounding box).
function cardOrigin(selection: readonly SceneNode[]): { x: number; y: number } {
  const b = getSelectionBounds(selection);
  return b
    ? { x: b.x + b.width + GAP_FROM_SELECTION, y: b.y }
    : FALLBACK_ORIGIN;
}

// The three Inter styles are requested together and the promise is kept for
// the rest of the plugin run; a failure drops it so the next export retries.
let fontsLoaded: Promise<void> | null = null;

function loadFonts(): Promise<void> {
  if (!fontsLoaded) {
    fontsLoaded = Promise.all(
      FONT_STYLES.map((style) =>
        figma.loadFontAsync({ family: FONT_FAMILY, style }),
      ),
    ).then(
      () => {},
      (error) => {
        fontsLoaded = null;
        throw error;
      },
    );
  }
  return fontsLoaded;
}

// ─────────────────────────────────────────────────────────────
// Canvas export
// ─────────────────────────────────────────────────────────────

// One export at a time: a request that arrives while another is still waiting
// for fonts or building its card is dropped.
let exporting = false;

export async function exportToCanvas(counts: TypeCounts): Promise<void> {
  const total = totalOf(counts);
  if (total === 0) {
    figma.notify("Select layers first");
    return;
  }
  if (exporting) return;
  exporting = true;

  let card: FrameNode | null = null;
  try {
    const origin = cardOrigin(figma.currentPage.selection);
    await loadFonts();
    const rows = entriesOf(counts).sort(byCountDesc);

    card = createCard(origin, rows.length);
    fillCard(card, total, rows);

    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);
  } catch (error) {
    try {
      card?.remove();
    } catch {
      // Nothing left to clean up.
    }
    const reason = error instanceof Error ? error.message : String(error);
    figma.notify("Export failed: " + reason, { error: true });
  } finally {
    exporting = false;
  }
}

// ─────────────────────────────────────────────────────────────
// Builders
//
// The card uses NONE layout (absolute positioning). A node is appended to its
// parent before its geometry is set, and a text node gets its fontName before
// its characters and is measured only after them: the Plugin API needs both.
// ─────────────────────────────────────────────────────────────

function frame(
  parent: ChildrenMixin,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): FrameNode {
  const node = figma.createFrame();
  parent.appendChild(node);
  node.name = name;
  node.x = x;
  node.y = y;
  node.resize(width, height);
  node.layoutMode = "NONE";
  return node;
}

function text(
  parent: ChildrenMixin,
  characters: string,
  style: string,
  alpha: number,
): TextNode {
  const node = figma.createText();
  parent.appendChild(node);
  node.fontName = { family: FONT_FAMILY, style };
  node.fontSize = FONT_SIZE;
  node.characters = characters;
  node.fills = [solid(BLACK, alpha)];
  return node;
}

// The empty, styled card on the current page.
function createCard(
  origin: { x: number; y: number },
  rowCount: number,
): FrameNode {
  const totalH = HEADER_H + DIVIDER_H + rowCount * ROW_H + LIST_PAD * 2;
  const card = frame(
    figma.currentPage,
    "Layer Counter",
    origin.x,
    origin.y,
    CARD_W,
    totalH,
  );
  card.fills = [solid(WHITE)];
  card.strokes = [solid(BLACK, 0.1)];
  card.strokeWeight = 1;
  card.strokeAlign = "INSIDE";
  card.cornerRadius = CARD_RADIUS;
  card.clipsContent = true;
  return card;
}

// Header, divider and one row per type, stacked top to bottom.
function fillCard(card: FrameNode, total: number, rows: Row[]): void {
  let cursorY = 0;

  appendHeader(card, cursorY, total);
  cursorY += HEADER_H;

  const divider = figma.createLine();
  card.appendChild(divider);
  divider.x = 0;
  divider.y = cursorY;
  divider.resize(CARD_W, 0);
  divider.strokes = [solid(BLACK, 0.08)];
  divider.strokeWeight = 1;
  cursorY += DIVIDER_H;

  cursorY += LIST_PAD;
  rows.forEach(([type, count], index) => {
    appendRow(card, cursorY, index, type, count);
    cursorY += ROW_H;
  });
}

function appendHeader(card: FrameNode, y: number, total: number): void {
  const headerBg = frame(card, "Header", 0, y, CARD_W, HEADER_H);
  headerBg.fills = [];

  const headerLabel = text(headerBg, "Selected Layers", "Semi Bold", 0.8);
  headerLabel.x = PAD_X;
  headerLabel.y = (HEADER_H - headerLabel.height) / 2;

  // The badge is sized from its text, so the text is created in the header
  // first, measured, and moved into the badge once that exists.
  const badgeText = text(headerBg, String(total), "Semi Bold", 0.75);
  const badgeW = badgeText.width + BADGE_PX * 2;
  const badgeH = badgeText.height + BADGE_PY * 2;

  const badge = frame(
    headerBg,
    "Badge",
    CARD_W - PAD_X - badgeW,
    (HEADER_H - badgeH) / 2,
    badgeW,
    badgeH,
  );
  badge.fills = [solid(BADGE_GREY)];
  badge.strokes = [solid(BLACK, 0.08)];
  badge.strokeWeight = 1;
  badge.strokeAlign = "INSIDE";
  badge.cornerRadius = BADGE_RADIUS;

  badge.appendChild(badgeText);
  badgeText.x = BADGE_PX;
  badgeText.y = BADGE_PY;
}

function appendRow(
  card: FrameNode,
  y: number,
  index: number,
  type: SceneNode["type"],
  count: number,
): void {
  const row = frame(card, typeLabel(type), 0, y, CARD_W, ROW_H);
  row.fills = index % 2 === 1 ? [solid(BLACK, 0.02)] : [];

  // Icon tile, vertically centred in the row
  const iconFrame = frame(
    row,
    "Icon",
    PAD_X,
    (ROW_H - ICON_SIZE) / 2,
    ICON_SIZE,
    ICON_SIZE,
  );
  iconFrame.cornerRadius = ICON_RADIUS;
  iconFrame.fills = [solid(BLACK, 0.06)];
  iconFrame.clipsContent = false;

  // Vector glyph inside the tile
  const iconPath = ICON_PATHS[type];
  if (iconPath) {
    const vec = figma.createVector();
    iconFrame.appendChild(vec);
    vec.vectorPaths = [{ windingRule: "EVENODD", data: iconPath }];
    vec.fills = [solid(BLACK, 0.55)];
    vec.strokes = [];
    vec.strokeWeight = 0;
    vec.resize(GLYPH_SIZE, GLYPH_SIZE);
    vec.x = GLYPH_INSET;
    vec.y = GLYPH_INSET;
  }

  const typeText = text(row, typeLabel(type), "Regular", 0.8);
  typeText.x = PAD_X + ICON_SIZE + LABEL_GAP;
  typeText.y = (ROW_H - typeText.height) / 2;

  // Right aligned
  const countText = text(row, String(count), "Medium", 0.4);
  countText.x = CARD_W - PAD_X - countText.width;
  countText.y = (ROW_H - countText.height) / 2;
}
