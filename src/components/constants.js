// Canvas events
export const CANVAS_ZOOM_EVENT = "canvas:zoom";

// Node Events
export const NODE_REMOVED_EVENT = "node:removed";
export const NODE_POINTER_DOWN_EVENT = "node:pointer:down";
export const NODE_MOVED_EVENT = "node:moved";
export const NODE_SELECTED_EVENT = "node:selected";
export const NODE_DESELECTED_EVENT = "node:deselected";
export const NODE_DROPPED_EVENT = "node:dropped";
export const NODE_UPDATED_EVENT = "node:updated";
export const NODE_LABEL_UPDATED_EVENT = "node:label:updated";
export const NODE_RESIZED_EVENT = "node:resized";

export const PORT_CONNECT_START_EVENT = "node:port:connect:start";
export const PORT_CONNECT_END_EVENT = "node:port:connect:end";

// Connection Events
export const CONNECTION_CREATED_EVENT = "connection:created";
export const CONNECTION_REMOVED_EVENT = "connection:removed";
export const CONNECTION_UPDATED_EVENT = "connection:updated";
export const CONNECTION_CLICKED_EVENT = "connection:clicked";
export const CONNECTION_SELECTED_EVENT = "connection:selected";
export const CONNECTION_DESELECTED_EVENT = "connection:deselected";

export const DEFAULT_CONNECTION_PATH_TYPE = "bezier";

export const CONNECTION_PATH_TYPES = {
  BEZIER: DEFAULT_CONNECTION_PATH_TYPE,
  STRAIGHT: "straight",
  ORTHOGONAL: "orthogonal",
};

export const COMMON_CAPABILITIES = {
  SELECTABLE: "selectable",
};

export const CAPABILITIES = {
  MOVABLE: "movable",
  EDITABLE_LABEL: "editable-label",
  RESIZABLE: "resizable",
  REMOVABLE: "removable",
};

export const DEFAULT_SUPPORTED_CAPABILITIES = [
  COMMON_CAPABILITIES.SELECTABLE,
  CAPABILITIES.MOVABLE,
  CAPABILITIES.EDITABLE_LABEL,
  CAPABILITIES.RESIZABLE,
  CAPABILITIES.REMOVABLE,
];

export const DEFAULT_SUPPORTED_CONNECTION_CAPABILITIES = [
  COMMON_CAPABILITIES.SELECTABLE,
  CAPABILITIES.REMOVABLE,
];

export const SVGShapes = ["ellipse", "circle", "rect", "line", "polyline", "polygon", "path"];
