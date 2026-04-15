import { countTypesForNodes, CountSettings, TypeCounts, macroCaseToTitleCase } from "../layerCounter";

let shouldCountChildren = true;
let shouldIncludeVariants = false;

Promise.all([
  figma.clientStorage.getAsync("shouldCountChildren"),
  figma.clientStorage.getAsync("shouldIncludeVariants")
]).then(([storedShouldCountChildren, storedShouldIncludeVariants]) => {
  shouldCountChildren = storedShouldCountChildren ?? shouldCountChildren;
  shouldIncludeVariants = storedShouldIncludeVariants ?? shouldIncludeVariants;
  postShouldCountChildrenMessage(shouldCountChildren);
  postShouldIncludeVariantsMessage(shouldIncludeVariants);
  postCountsMessage(figma.currentPage.selection, { shouldCountChildren, shouldIncludeVariants });
});

figma.showUI(__html__, { width: 240, height: 360, themeColors: true });

figma.on("selectionchange", () => {
  postCountsMessage(figma.currentPage.selection, { shouldCountChildren, shouldIncludeVariants });
});
figma.on("currentpagechange", () => {
  postCountsMessage(figma.currentPage.selection, { shouldCountChildren, shouldIncludeVariants });
});

figma.ui.onmessage = ({ type, message }) => {
  if (type === "toggleCountChildren") {
    figma.clientStorage.setAsync("shouldCountChildren", message);
    shouldCountChildren = message;
    postCountsMessage(figma.currentPage.selection, { shouldCountChildren, shouldIncludeVariants });
  } else if (type === "toggleIncludeVariants") {
    figma.clientStorage.setAsync("shouldIncludeVariants", message);
    shouldIncludeVariants = message;
    postCountsMessage(figma.currentPage.selection, { shouldCountChildren, shouldIncludeVariants });
  } else if (type === "exportToCanvas") {
    exportToCanvas(message.counts, message.total);
  }
};

function postCountsMessage(nodes: readonly SceneNode[], settings: CountSettings) {
  const counts = countTypesForNodes([...nodes], settings);
  figma.ui.postMessage({ type: "updateCounts", message: counts });
}
function postShouldCountChildrenMessage(v: boolean) {
  figma.ui.postMessage({ type: "shouldCountChildren", message: v });
}
function postShouldIncludeVariantsMessage(v: boolean) {
  figma.ui.postMessage({ type: "shouldIncludeVariants", message: v });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const CARD_W = 240;
const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 1, g: 1, b: 1 };

function solid(color: RGB, opacity: number = 1): SolidPaint {
  return { type: "SOLID", color, opacity };
}

function getSelectionBounds(nodes: readonly SceneNode[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const b = (node as any).absoluteBoundingBox;
    if (!b) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ─────────────────────────────────────────────────────────────
// Canvas export
// ─────────────────────────────────────────────────────────────

async function exportToCanvas(counts: TypeCounts, total: number) {
  const selection = figma.currentPage.selection;
  let px = 100, py = 100;
  if (selection.length > 0) {
    const b = getSelectionBounds(selection);
    px = b.x + b.width + 40;
    py = b.y;
  }

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

  const sortedCounts = Object.entries(counts)
    .sort(([, a], [, b]) => b - a) as Array<[string, number]>;

  // ── Calculate total height manually ─────────────────────
  const HEADER_H = 40;
  const DIVIDER_H = 1;
  const ROW_H = 30;
  const totalH = HEADER_H + DIVIDER_H + (sortedCounts.length * ROW_H) + 8; // 8px padding top+bottom on rows

  // ── Card (NONE layout — absolute positioning for reliability) ──
  const card = figma.createFrame();
  figma.currentPage.appendChild(card);
  card.name = "Layer Counter";
  card.x = px;
  card.y = py;
  card.resize(CARD_W, totalH);
  card.fills = [solid(WHITE)];
  card.strokes = [solid(BLACK, 0.1)];
  card.strokeWeight = 1;
  card.strokeAlign = "INSIDE";
  card.cornerRadius = 10;
  card.clipsContent = true;
  card.effects = [];
  card.layoutMode = "NONE";

  // ── Header ──────────────────────────────────────────────
  let cursorY = 0;

  const headerBg = figma.createFrame();
  card.appendChild(headerBg);
  headerBg.name = "Header";
  headerBg.x = 0;
  headerBg.y = cursorY;
  headerBg.resize(CARD_W, HEADER_H);
  headerBg.fills = [];
  headerBg.layoutMode = "NONE";

  // "Selected Layers" label
  const headerLabel = figma.createText();
  headerBg.appendChild(headerLabel);
  headerLabel.characters = "Selected Layers";
  headerLabel.fontName = { family: "Inter", style: "Semi Bold" };
  headerLabel.fontSize = 11;
  headerLabel.fills = [solid(BLACK, 0.8)];
  headerLabel.x = 14;
  headerLabel.y = (HEADER_H - headerLabel.height) / 2;

  // Badge
  const BADGE_PX = 8;
  const BADGE_PY = 3;

  const badgeText = figma.createText();
  headerBg.appendChild(badgeText);
  badgeText.characters = String(total);
  badgeText.fontName = { family: "Inter", style: "Semi Bold" };
  badgeText.fontSize = 11;
  badgeText.fills = [solid(BLACK, 0.75)];

  const badgeW = badgeText.width + BADGE_PX * 2;
  const badgeH = badgeText.height + BADGE_PY * 2;

  const badge = figma.createFrame();
  headerBg.appendChild(badge);
  badge.name = "Badge";
  badge.x = CARD_W - 14 - badgeW;
  badge.y = (HEADER_H - badgeH) / 2;
  badge.resize(badgeW, badgeH);
  badge.fills = [solid({ r: 0.957, g: 0.957, b: 0.957 })];
  badge.strokes = [solid(BLACK, 0.08)];
  badge.strokeWeight = 1;
  badge.strokeAlign = "INSIDE";
  badge.cornerRadius = 5;
  badge.layoutMode = "NONE";

  // Move badgeText into badge
  badge.appendChild(badgeText);
  badgeText.x = BADGE_PX;
  badgeText.y = BADGE_PY;

  cursorY += HEADER_H;

  // ── Divider ──────────────────────────────────────────────
  const divider = figma.createLine();
  card.appendChild(divider);
  divider.x = 0;
  divider.y = cursorY;
  divider.resize(CARD_W, 0);
  divider.strokes = [solid(BLACK, 0.08)];
  divider.strokeWeight = 1;

  cursorY += DIVIDER_H;

  // ── Rows ────────────────────────────────────────────────
  cursorY += 4; // top padding

  for (let i = 0; i < sortedCounts.length; i++) {
    const [type, count] = sortedCounts[i];

    const row = figma.createFrame();
    card.appendChild(row);
    row.name = macroCaseToTitleCase(type);
    row.x = 0;
    row.y = cursorY;
    row.resize(CARD_W, ROW_H);
    row.fills = i % 2 === 1 ? [solid(BLACK, 0.02)] : [];
    row.layoutMode = "NONE";

    // Icon frame 20×20, vertically centred in row
    const ICON_SIZE = 20;
    const iconFrame = figma.createFrame();
    row.appendChild(iconFrame);
    iconFrame.name = "Icon";
    iconFrame.x = 14;
    iconFrame.y = (ROW_H - ICON_SIZE) / 2;
    iconFrame.resize(ICON_SIZE, ICON_SIZE);
    iconFrame.cornerRadius = 4;
    iconFrame.fills = [solid(BLACK, 0.06)];
    iconFrame.layoutMode = "NONE";
    iconFrame.clipsContent = false;

    // Vector icon inside (16×16, offset 2px from edges)
    const iconPath = ICON_PATHS[type];
    if (iconPath) {
      const vec = figma.createVector();
      iconFrame.appendChild(vec);
      vec.vectorPaths = [{ windingRule: "EVENODD", data: iconPath }];
      vec.fills = [solid(BLACK, 0.55)];
      vec.strokes = [];
      vec.strokeWeight = 0;
      vec.resize(16, 16);
      vec.x = 2;
      vec.y = 2;
    }

    // Type label — starts right of icon with 16px gap
    const TYPE_X = 14 + ICON_SIZE + 16;
    const typeLabel = figma.createText();
    row.appendChild(typeLabel);
    typeLabel.characters = macroCaseToTitleCase(type);
    typeLabel.fontName = { family: "Inter", style: "Regular" };
    typeLabel.fontSize = 11;
    typeLabel.fills = [solid(BLACK, 0.8)];
    typeLabel.x = TYPE_X;
    typeLabel.y = (ROW_H - typeLabel.height) / 2;

    // Count label — right aligned
    const countLabel = figma.createText();
    row.appendChild(countLabel);
    countLabel.characters = String(count);
    countLabel.fontName = { family: "Inter", style: "Medium" };
    countLabel.fontSize = 11;
    countLabel.fills = [solid(BLACK, 0.4)];
    countLabel.x = CARD_W - 14 - countLabel.width;
    countLabel.y = (ROW_H - countLabel.height) / 2;

    cursorY += ROW_H;
  }

  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
}

// ─────────────────────────────────────────────────────────────
// SVG icon paths — 16×16 grid
// ─────────────────────────────────────────────────────────────

const ICON_PATHS: { [key: string]: string } = {
  FRAME:
    "M5 2H4v3H1v1h3v4H1v1h3v3h1v-3h6v3h1v-3h3v-1h-3V6h3V5h-3V2h-1v3H5V2zM11 11V6H5v5h6z",
  GROUP:
    "M3 3h10v10H3V3zM4 4v8h8V4H4zM1 6h1v4H1V6zM14 6h1v4h-1V6zM6 1h4v1H6V1zM6 14h4v1H6v-1z",
  COMPONENT:
    "M8 1L1 8l7 7 7-7-7-7zM8 3.414L13.586 9H2.414L8 3.414zM8 6L6 8l2 2 2-2-2-2z",
  INSTANCE:
    "M8 1L1 8l7 7 7-7-7-7zM8 3.414L13.586 9H2.414L8 3.414z",
  TEXT:
    "M3 4h10v2h-1V5H9v7h1v1H6v-1h1V5H4v1H3V4z",
  VECTOR:
    "M3.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM4.5 5.5L2.5 8l2 2 1-1h4l1 1 2-2-2-2-1 1h-4l-1-1z",
  RECTANGLE:
    "M2 4h12v8H2V4zM3 5v6h10V5H3z",
  ELLIPSE:
    "M8 3C5.239 3 3 5.239 3 8s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zM4 8a4 4 0 118 0 4 4 0 01-8 0z",
  POLYGON:
    "M8 2.5l5.5 10h-11L8 2.5zM8 5.33L4.87 11.5h6.26L8 5.33z",
  STAR:
    "M8 1.5l1.796 3.637 4.013.583-2.904 2.83.686 3.997L8 10.387l-3.591 2.16.686-3.997L2.19 5.72l4.013-.583L8 1.5zM8 4.236L6.725 6.82 3.882 7.243l2.059 2.006-.486 2.835L8 10.764l2.545 1.32-.486-2.835 2.059-2.006-2.843-.423L8 4.236z",
  LINE:
    "M1 8h14v1H1V8z",
  BOOLEAN_OPERATION:
    "M2 2h7v7H2V2zM3 3v5h5V3H3zM7 7h7v7H7V7zM8 8v5h5V8H8zM7 7H2v-1h5v1zM7 7v5H6V7h1z",
  COMPONENT_SET:
    "M1 2h14a1 1 0 011 1v10a1 1 0 01-1 1H1a1 1 0 01-1-1V3a1 1 0 011-1zm0 1v10h14V3H1zM8 5l-3 3 3 3 3-3-3-3z",
  SECTION:
    "M0 2h16v3H0V2zM0 3v1h16V3H0zM0 5h16v9H0V5zM1 6v7h14V6H1zM2 3h3v1H2V3z",
  SLICE:
    "M1 1h14v14H1V1zM2 2v12h12V2H2z",
};
