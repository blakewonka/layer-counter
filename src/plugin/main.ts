import { countNodes } from "./count.ts";
import { exportToCanvas } from "./exportCard.ts";
import type { TypeCounts } from "../shared/counts.ts";
import type {
  PluginToUiMessage,
  UiToPluginMessage,
} from "../shared/messages.ts";

const STORAGE_KEY = "shouldCountChildren";

// The stored setting is read right away but reported only once the UI says it
// is listening ("uiReady"), so the UI always receives shouldCountChildren
// first and updateCounts second, each exactly once. Anything but a stored
// boolean (never set, or storage failing) means the default: nested layers
// are included.
const storedIncludeNested: Promise<boolean> = figma.clientStorage
  .getAsync(STORAGE_KEY)
  .then(
    (value) => (typeof value === "boolean" ? value : true),
    () => true,
  );

let includeNested = true;
let uiReady = false;
let lastCounts: TypeCounts = {};
// JSON of the counts last posted to the UI; null makes the next refresh post
// unconditionally. Key order is serialized on purpose: it is part of the
// contract with the UI.
let lastSentKey: string | null = null;

figma.showUI(__html__, { width: 240, height: 360, themeColors: true });

figma.on("selectionchange", refresh);
figma.on("currentpagechange", refresh);

figma.ui.onmessage = async (message: UiToPluginMessage) => {
  switch (message.type) {
    case "uiReady":
      includeNested = await storedIncludeNested;
      uiReady = true;
      lastSentKey = null;
      post({ type: "shouldCountChildren", message: includeNested });
      refresh();
      break;
    case "toggleCountChildren":
      includeNested = message.message;
      figma.clientStorage
        .setAsync(STORAGE_KEY, message.message)
        .catch(() => {});
      refresh();
      break;
    case "exportToCanvas":
      // The UI still sends its own counts for protocol compatibility; the card
      // is built from what this side counted most recently.
      await exportToCanvas(lastCounts);
      break;
  }
};

// Recounts the selection and posts the result only when it differs from what
// the UI already has. Does nothing until the UI is ready.
function refresh(): void {
  if (!uiReady) return;
  const counts = countNodes(figma.currentPage.selection, includeNested);
  lastCounts = counts;
  const key = JSON.stringify(counts);
  if (key === lastSentKey) return;
  lastSentKey = key;
  post({ type: "updateCounts", message: counts });
}

function post(message: PluginToUiMessage): void {
  figma.ui.postMessage(message);
}
