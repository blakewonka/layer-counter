// List of node types can be found at https://github.com/figma/plugin-typings
export type SceneNodeType = SceneNode["type"];
export type TypeCounts = { [type in SceneNodeType]?: number };

export type CountSettings = {
  shouldCountChildren: boolean;
  shouldIncludeVariants: boolean;
};

export function countTypesForNodes(
  nodes: SceneNode[],
  { shouldCountChildren, shouldIncludeVariants }: CountSettings
): TypeCounts {
  let _nodes: SceneNode[] = nodes;

  if (shouldCountChildren) {
    _nodes = [..._nodes, ...nodes.flatMap(getChildrenRecursive)];
  }

  if (shouldIncludeVariants) {
    const uniqueComponentSetNodes = [
      ...new Set(
        _nodes
          .map(getComponentSetNodeFromNode)
          .filter(nodeOrNull => nodeOrNull != null)
      )
    ];

    let variantNodes: SceneNode[] = uniqueComponentSetNodes.flatMap(
      node => node.children
    );
    if (shouldCountChildren) {
      variantNodes = [
        ...variantNodes,
        ...variantNodes.flatMap(getChildrenRecursive)
      ];
    }

    _nodes = [...new Set([..._nodes, ...variantNodes])];
  }

  const typeCounts = _nodes.reduce((accumulator, node) => {
    accumulator[node.type] = (accumulator[node.type] ?? 0) + 1;
    return accumulator;
  }, {} as TypeCounts);

  return typeCounts;
}

function getChildrenRecursive(node: SceneNode): SceneNode[] {
  if (supportsChildren(node)) {
    return node.findAll(() => true);
  }
  return [];
}

function supportsChildren(
  node: SceneNode
): node is
  | FrameNode
  | GroupNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | ComponentSetNode
  | SectionNode {
  return (
    node.type === "FRAME" ||
    node.type === "GROUP" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "COMPONENT_SET" ||
    node.type === "SECTION"
  );
}

function getComponentSetNodeFromNode(node): ComponentSetNode | null {
  if (
    node.type === "INSTANCE" &&
    node.mainComponent.parent != null &&
    node.mainComponent.parent.type === "COMPONENT_SET"
  ) {
    return node.mainComponent.parent;
  } else if (
    node.type === "COMPONENT" &&
    node.parent != null &&
    node.parent.type === "COMPONENT_SET"
  ) {
    return node.parent;
  } else {
    return null;
  }
}

export function macroCaseToTitleCase(string: string): string {
  return string
    .split("_")
    .map(capitalizeFirstLetter)
    .join(" ");
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
