import { test } from "node:test";
import assert from "node:assert/strict";
import { typeLabel, totalOf } from "../src/shared/counts.ts";

test("typeLabel turns a MACRO_CASE node type into Title Case", () => {
  assert.equal(typeLabel("BOOLEAN_OPERATION"), "Boolean Operation");
  assert.equal(typeLabel("TEXT"), "Text");
  assert.equal(typeLabel("COMPONENT_SET"), "Component Set");
});

test("totalOf sums every count", () => {
  assert.equal(totalOf({}), 0);
  assert.equal(totalOf({ FRAME: 2 }), 2);
  assert.equal(totalOf({ FRAME: 2, TEXT: 3, RECTANGLE: 1 }), 6);
});
