// Inline SVG icons for the count rows, keyed by SceneNode["type"]. Each value is
// the inner markup of a 16×16 "fill: none" SVG; icon() wraps it. Sizing is done
// in CSS (.count-icon svg), so the markup carries no width/height/style.

const ICONS: Partial<Record<string, string>> = {
  FRAME:
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M5 2H4v3H1v1h3v4H1v1h3v3h1v-3h6v3h1v-3h3v-1h-3V6h3V5h-3V2h-1v3H5V2zm6 9V6H5v5h6z" fill="currentColor" fill-opacity="0.8"/>',
  GROUP:
    '<path d="M4 4h8v8H4z" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>' +
    '<path d="M2 6v4M14 6v4M6 2h4M6 14h4" stroke="currentColor" stroke-opacity="0.8" stroke-width="1"/>',
  COMPONENT:
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.5L1.5 8 8 14.5 14.5 8 8 1.5zM8 3.328L13.172 8 8 12.672 2.828 8 8 3.328z" fill="currentColor" fill-opacity="0.8"/>' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 5.5L5.5 8 8 10.5 10.5 8 8 5.5z" fill="currentColor" fill-opacity="0.8"/>',
  INSTANCE:
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.5L1.5 8 8 14.5 14.5 8 8 1.5zM8 3.328L13.172 8 8 12.672 2.828 8 8 3.328z" fill="currentColor" fill-opacity="0.4"/>' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 5.5L5.5 8 8 10.5 10.5 8 8 5.5z" fill="currentColor" fill-opacity="0.4"/>',
  TEXT: '<path d="M3 4h10v2h-1V5H9v7h1v1H6v-1h1V5H4v1H3V4z" fill="currentColor" fill-opacity="0.8"/>',
  VECTOR:
    '<path d="M5.5 6.5L3 9l2.5 2.5 1.5-1.5h3l1.5 1.5L14 9l-2.5-2.5L10 8H6L5.5 6.5z" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>' +
    '<circle cx="5" cy="5" r="1.5" fill="currentColor" fill-opacity="0.8"/>' +
    '<circle cx="11" cy="5" r="1.5" fill="currentColor" fill-opacity="0.8"/>' +
    '<circle cx="5" cy="11" r="1.5" fill="currentColor" fill-opacity="0.8"/>' +
    '<circle cx="11" cy="11" r="1.5" fill="currentColor" fill-opacity="0.8"/>',
  RECTANGLE:
    '<rect x="3" y="5" width="10" height="7" rx="0.5" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>',
  ELLIPSE:
    '<ellipse cx="8" cy="8.5" rx="5" ry="4" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>',
  POLYGON:
    '<path d="M8 3L13.196 12H2.804L8 3z" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>',
  STAR: '<path d="M8 2.5l1.545 3.13 3.455.502-2.5 2.437.59 3.44L8 10.385l-3.09 1.624.59-3.44L3 6.132l3.455-.502L8 2.5z" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>',
  LINE:
    '<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-opacity="0.8" stroke-width="1.5"/>' +
    '<circle cx="2" cy="8" r="1.5" fill="currentColor" fill-opacity="0.8"/>' +
    '<circle cx="14" cy="8" r="1.5" fill="currentColor" fill-opacity="0.8"/>',
  BOOLEAN_OPERATION:
    '<rect x="3" y="3" width="7" height="7" rx="0.5" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>' +
    '<rect x="6" y="6" width="7" height="7" rx="0.5" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none"/>',
  COMPONENT_SET:
    '<path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" fill="none" stroke-dasharray="2 1.5"/>' +
    '<path d="M8 5L5.5 8 8 11 10.5 8 8 5z" fill="currentColor" fill-opacity="0.6"/>',
  SECTION:
    '<rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" stroke-opacity="0.5" stroke-width="1" fill="none" stroke-dasharray="3 2"/>' +
    '<path d="M1 5h14" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>' +
    '<path d="M3 3h4" stroke="currentColor" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>',
  SLICE:
    '<rect x="2" y="2" width="12" height="12" stroke="currentColor" stroke-opacity="0.6" stroke-width="1" fill="none" stroke-dasharray="2 2"/>' +
    '<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-opacity="0.4" stroke-width="0.75"/>',
};

/** Shown for node types without an icon of their own (STICKY, WIDGET, ...). */
const DEFAULT_ICON =
  '<rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-opacity="0.4" stroke-width="1" fill="none"/>';

/** The complete SVG element for a node type, ready for innerHTML. */
export function icon(type: string): string {
  const inner = ICONS[type] ?? DEFAULT_ICON;
  return `<svg viewBox="0 0 16 16" fill="none">${inner}</svg>`;
}
