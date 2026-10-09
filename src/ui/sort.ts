// Row order in the UI list: count descending, then type name, so ties render
// in a stable order. (The canvas card deliberately uses a different order; see
// byCountDesc in src/plugin/exportCard.ts.)
export function compareUiRows(
  [aKey, aValue]: readonly [string, number],
  [bKey, bValue]: readonly [string, number],
): number {
  if (bValue !== aValue) return bValue - aValue;
  return aKey.localeCompare(bKey);
}
