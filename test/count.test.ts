import { test } from "node:test";
import assert from "node:assert/strict";
import { countNodes } from "../src/plugin/count.ts";

// Minimal stand-ins for SceneNode: only `type`, plus `findAll` on containers.
// Figma's findAll is recursive, so a fake returns its whole flattened subtree.
type FakeNode = { type: string; visible?: boolean; findAll?: () => FakeNode[] };

function leaf(type: string, visible = true): FakeNode {
  return { type, visible };
}
function container(type: string, descendants: FakeNode[]): FakeNode {
  return { type, visible: true, findAll: () => descendants };
}
function count(nodes: FakeNode[], includeNested: boolean) {
  return countNodes(nodes as unknown as SceneNode[], includeNested);
}

const CONTAINER_TYPES = [
  "FRAME",
  "GROUP",
  "COMPONENT",
  "INSTANCE",
  "BOOLEAN_OPERATION",
  "COMPONENT_SET",
  "SECTION",
];

test("shallow counts only the selected nodes; nested adds every descendant", () => {
  // FRAME > [TEXT, GROUP > [VECTOR], VECTOR], flattened the way findAll reports it.
  const groupVector = leaf("VECTOR");
  const selection = [
    container("FRAME", [
      leaf("TEXT"),
      container("GROUP", [groupVector]),
      groupVector,
      leaf("VECTOR"),
    ]),
    leaf("TEXT"),
  ];
  assert.deepEqual(count(selection, false), { FRAME: 1, TEXT: 1 });
  assert.deepEqual(count(selection, true), {
    FRAME: 1,
    TEXT: 2,
    GROUP: 1,
    VECTOR: 2,
  });
});

test("invisible nodes are counted", () => {
  const selection = [
    container("FRAME", [leaf("TEXT", false), leaf("RECTANGLE", false)]),
    leaf("ELLIPSE", false),
  ];
  assert.deepEqual(count(selection, true), {
    FRAME: 1,
    TEXT: 1,
    RECTANGLE: 1,
    ELLIPSE: 1,
  });
});

test("key order: all selected nodes first, then each node's descendants in turn", () => {
  const selection = [
    leaf("TEXT"),
    container("FRAME", [leaf("RECTANGLE"), leaf("ELLIPSE"), leaf("TEXT")]),
    container("GROUP", [leaf("VECTOR"), leaf("RECTANGLE")]),
  ];
  const counts = count(selection, true);
  assert.deepEqual(Object.keys(counts), [
    "TEXT",
    "FRAME",
    "GROUP",
    "RECTANGLE",
    "ELLIPSE",
    "VECTOR",
  ]);
  assert.deepEqual(counts, {
    TEXT: 2,
    FRAME: 1,
    GROUP: 1,
    RECTANGLE: 2,
    ELLIPSE: 1,
    VECTOR: 1,
  });
});

test("a selected non-container node has no findAll and is counted once", () => {
  assert.deepEqual(count([leaf("TEXT")], true), { TEXT: 1 });
  assert.deepEqual(count([leaf("TEXT"), leaf("TEXT")], true), { TEXT: 2 });
});

test("only the seven container types are traversed", () => {
  for (const type of CONTAINER_TYPES) {
    assert.deepEqual(
      count([container(type, [leaf("VECTOR")])], true),
      { [type]: 1, VECTOR: 1 },
      type,
    );
  }
  // A node of another type is never descended into, even if it exposes findAll.
  const oddNode: FakeNode = { type: "TEXT", findAll: () => [leaf("VECTOR")] };
  assert.deepEqual(count([oddNode], true), { TEXT: 1 });
});

test("empty selection yields an empty object", () => {
  assert.deepEqual(count([], true), {});
  assert.deepEqual(count([], false), {});
});
