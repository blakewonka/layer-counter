// The message protocol between the plugin sandbox and the UI iframe.
// Types only: this module has no runtime code.

import type { TypeCounts } from "./counts.ts";

/** Sent with `figma.ui.postMessage`, received by the UI as `event.data.pluginMessage`. */
export type PluginToUiMessage =
  | { type: "shouldCountChildren"; message: boolean }
  | { type: "updateCounts"; message: TypeCounts };

/** Sent by the UI with `parent.postMessage({ pluginMessage }, "*")`, received in `figma.ui.onmessage`. */
export type UiToPluginMessage =
  | { type: "uiReady" }
  | { type: "toggleCountChildren"; message: boolean }
  | { type: "exportToCanvas"; message: { counts: TypeCounts; total: number } };
