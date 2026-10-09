import type { TypeCounts } from "../shared/counts.ts";

type ContainerNode =
  | FrameNode
  | GroupNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | ComponentSetNode
  | SectionNode;

// The node types whose descendants are counted when "Include nested layers"
// is on. Deliberately an explicit list rather than "anything with findAll".
const CONTAINER_TYPES: ReadonlySet<SceneNode["type"]> = new Set<
  SceneNode["type"]
>([
  "FRAME",
  "GROUP",
  "COMPONENT",
  "INSTANCE",
  "BOOLEAN_OPERATION",
  "COMPONENT_SET",
  "SECTION",
]);

function isContainer(node: SceneNode): node is ContainerNode {
  return CONTAINER_TYPES.has(node.type);
}

/**
 * Counts the selected nodes by type and, when `includeNested` is set, every
 * descendant of each selected container (invisible nodes included).
 *
 * Keys are inserted in a fixed order that is part of the contract (the canvas
 * card keeps it for ties): all selected nodes first, in selection order, then
 * the descendants of each selected node in turn.
 */
export function countNodes(
  nodes: readonly SceneNode[],
  includeNested: boolean,
): TypeCounts {
  const counts: TypeCounts = {};
  const add = (type: SceneNode["type"]) => {
    counts[type] = (counts[type] ?? 0) + 1;
  };

  for (const node of nodes) add(node.type);

  if (includeNested) {
    for (const node of nodes) {
      if (!isContainer(node)) continue;
      // findAll with no callback returns every descendant, visible or not.
      for (const descendant of node.findAll()) add(descendant.type);
    }
  }

  return counts;
}
