// Canvas events
export const CANVAS_ZOOM_EVENT = "canvas:zoom";

// Node Events
export const NODE_REMOVED_EVENT = "node:removed";
export const NODE_POINTER_DOWN_EVENT = "node:pointer:down";
export const NODE_MOVED_EVENT = "node:moved";
export const NODE_SELECTED_EVENT = "node:selected";
export const NODE_DESELECTED_EVENT = "node:deselected";
export const NODE_DROPPED_EVENT = "node:dropped";

export const PORT_CONNECT_START_EVENT = "node:port:connect:start";
export const PORT_CONNECT_END_EVENT = "node:port:connect:end";

// Connection Events
export const CONNECTION_CREATED_EVENT = "connection:created";
export const CONNECTION_REMOVED_EVENT = "connection:removed";
export const CONNECTION_UPDATED_EVENT = "connection:updated";
export const CONNECTION_CLICKED_EVENT = "connection:clicked";

export const CONNECTION_PATH_TYPES = {
  BEZIER: "bezier",
  STRAIGHT: "straight",
  ORTHOGONAL: "orthogonal"
};

export const DEFAULT_NODE_BEHAVIORS = {
  SELECTABLE: "selectable",
  DRAGGABLE: "draggable",
};
