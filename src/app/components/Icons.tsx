import * as React from "react";

const iconStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  flexShrink: 0,
  display: "inline-block",
};

export const FrameIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M5 2H4v3H1v1h3v4H1v1h3v3h1v-3h6v3h1v-3h3v-1h-3V6h3V5h-3V2h-1v3H5V2zm6 9V6H5v5h6z"
      fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

export const GroupIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h8v8H4z" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
    <path d="M2 6v4M14 6v4M6 2h4M6 14h4" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1"/>
  </svg>
);

export const ComponentIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 1.5L1.5 8 8 14.5 14.5 8 8 1.5zM8 3.328L13.172 8 8 12.672 2.828 8 8 3.328z"
      fill="currentColor" fillOpacity="0.8"/>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 5.5L5.5 8 8 10.5 10.5 8 8 5.5z"
      fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

export const InstanceIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 1.5L1.5 8 8 14.5 14.5 8 8 1.5zM8 3.328L13.172 8 8 12.672 2.828 8 8 3.328z"
      fill="currentColor" fillOpacity="0.4"/>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 5.5L5.5 8 8 10.5 10.5 8 8 5.5z"
      fill="currentColor" fillOpacity="0.4"/>
  </svg>
);

export const TextIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4h10v2h-1V5H9v7h1v1H6v-1h1V5H4v1H3V4z"
      fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

export const VectorIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 6.5L3 9l2.5 2.5 1.5-1.5h3l1.5 1.5L14 9l-2.5-2.5L10 8H6L5.5 6.5z"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
    <circle cx="5" cy="5" r="1.5" fill="currentColor" fillOpacity="0.8"/>
    <circle cx="11" cy="5" r="1.5" fill="currentColor" fillOpacity="0.8"/>
    <circle cx="5" cy="11" r="1.5" fill="currentColor" fillOpacity="0.8"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

export const RectangleIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="10" height="7" rx="0.5"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
  </svg>
);

export const EllipseIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="8" cy="8.5" rx="5" ry="4"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
  </svg>
);

export const PolygonIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3L13.196 12H2.804L8 3z"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
  </svg>
);

export const StarIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2.5l1.545 3.13 3.455.502-2.5 2.437.59 3.44L8 10.385l-3.09 1.624.59-3.44L3 6.132l3.455-.502L8 2.5z"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
  </svg>
);

export const LineIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="8" x2="14" y2="8"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5"/>
    <circle cx="2" cy="8" r="1.5" fill="currentColor" fillOpacity="0.8"/>
    <circle cx="14" cy="8" r="1.5" fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

export const BooleanIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="0.5"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
    <rect x="6" y="6" width="7" height="7" rx="0.5"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none"/>
  </svg>
);

export const ComponentSetIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"
      stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" fill="none" strokeDasharray="2 1.5"/>
    <path d="M8 5L5.5 8 8 11 10.5 8 8 5z" fill="currentColor" fillOpacity="0.6"/>
  </svg>
);

export const SectionIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="14" height="14" rx="1"
      stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" fill="none" strokeDasharray="3 2"/>
    <path d="M1 5h14" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1"/>
    <path d="M3 3h4" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const SliceIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="12"
      stroke="currentColor" strokeOpacity="0.6" strokeWidth="1" fill="none" strokeDasharray="2 2"/>
    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.75"/>
  </svg>
);

export const DefaultIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1"
      stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" fill="none"/>
  </svg>
);

export const ExportIcon = () => (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
