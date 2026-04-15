import * as React from "react";
import { SceneNodeType, macroCaseToTitleCase } from "../../layerCounter";
import {
  FrameIcon, GroupIcon, ComponentIcon, InstanceIcon, TextIcon,
  VectorIcon, RectangleIcon, EllipseIcon, PolygonIcon, StarIcon,
  LineIcon, BooleanIcon, ComponentSetIcon, SectionIcon, SliceIcon,
  DefaultIcon
} from "./Icons";

type Props = {
  type: SceneNodeType;
  count: number;
};

const typeToIcon: { [key: string]: React.FC } = {
  FRAME: FrameIcon,
  GROUP: GroupIcon,
  COMPONENT: ComponentIcon,
  INSTANCE: InstanceIcon,
  TEXT: TextIcon,
  VECTOR: VectorIcon,
  RECTANGLE: RectangleIcon,
  ELLIPSE: EllipseIcon,
  POLYGON: PolygonIcon,
  STAR: StarIcon,
  LINE: LineIcon,
  BOOLEAN_OPERATION: BooleanIcon,
  COMPONENT_SET: ComponentSetIcon,
  SECTION: SectionIcon,
  SLICE: SliceIcon,

};

const CountRow = ({ type, count }: Props) => {
  const Icon = typeToIcon[type] || DefaultIcon;
  return (
    <div className="count-row">
      <span className="count-icon"><Icon /></span>
      <span className="count-type">{macroCaseToTitleCase(type)}</span>
      <span className="count-value">{count}</span>
    </div>
  );
};

export default CountRow;
