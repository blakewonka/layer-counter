// Pure helpers shared by the plugin sandbox and the UI iframe. No Figma API
// calls live here; `SceneNode` is the global type from @figma/plugin-typings
// and is only used in type positions.

// List of node types can be found at https://github.com/figma/plugin-typings
export type TypeCounts = { [type in SceneNode["type"]]?: number };

/** "BOOLEAN_OPERATION" -> "Boolean Operation" */
export function typeLabel(type: string): string {
  return type.split("_").map(capitalizeFirstLetter).join(" ");
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/** [type, count] pairs in key order. A key that is present always has a number. */
export function entriesOf(
  counts: TypeCounts,
): Array<[SceneNode["type"], number]> {
  return Object.entries(counts) as Array<[SceneNode["type"], number]>;
}

/** Sum of all counts. */
export function totalOf(counts: TypeCounts): number {
  return entriesOf(counts).reduce((sum, [, count]) => sum + count, 0);
}
