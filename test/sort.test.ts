import { test } from "node:test";
import assert from "node:assert/strict";
import { byCountDesc } from "../src/plugin/exportCard.ts";
import { compareUiRows } from "../src/ui/sort.ts";

const entries = (counts: Record<string, number>) =>
  Object.entries(counts) as Array<[string, number]>;

test("canvas card: count descending, ties keep TypeCounts key order", () => {
  const rows = entries({
    TEXT: 2,
    FRAME: 5,
    RECTANGLE: 2,
    GROUP: 5,
    VECTOR: 9,
  });
  assert.deepEqual(
    rows.sort(byCountDesc).map(([type]) => type),
    ["VECTOR", "FRAME", "GROUP", "TEXT", "RECTANGLE"],
  );
});

test("canvas card: a tie between TEXT and RECTANGLE is not reordered", () => {
  assert.deepEqual(
    entries({ TEXT: 1, RECTANGLE: 1 })
      .sort(byCountDesc)
      .map(([type]) => type),
    ["TEXT", "RECTANGLE"],
  );
});

test("UI list: count descending, then localeCompare on the type", () => {
  const rows = entries({ TEXT: 2, FRAME: 5, RECTANGLE: 2 });
  assert.deepEqual(
    rows.sort(compareUiRows).map(([type]) => type),
    ["FRAME", "RECTANGLE", "TEXT"],
  );
});
