'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class DragHandler {
  constructor(
    element,
    onMoveHandler,
    initialPosition = { x: 0, y: 0 },
    startDragPosition = { x: 0, y: 0 },
    zoom = 1,
    onMoveCursor = "grabbing",
    onReleaseCursor = "grab"
  ) {
    this.element = element;
    this.onMoveHandler = onMoveHandler;
    this.zoomGetter = typeof zoom === "function" ? zoom : () => zoom;

    this.isDragging = false;
    this.dragStartPosition = startDragPosition;
    this.initialPosition = initialPosition;

    this.elementX = this.initialPosition.x;
    this.elementY = this.initialPosition.y;

    this.rafId = null;
    this.onMoveCursor = onMoveCursor;
    this.onReleaseCursor = onReleaseCursor;

    this.MOUSE_RIGHT_CLICK = 2;
  }

  destroy() {
    this.element.removeEventListener("mousedown", this.onHold.bind(this));
    window.removeEventListener("mousemove", this.onMove.bind(this));
    window.removeEventListener("mouseup", this.onRelease.bind(this));
  }

  registerDragEvent() {
    // Canvas Panning Listeners for click and drag, draggable will not work
    // as it will go to initial position when click is released
    this.element.addEventListener("mousedown", this.onHold.bind(this));
  }

  onHold(e) {
    if (e.button === this.MOUSE_RIGHT_CLICK) {
      console.debug("FLOW: Ignoreing Right click on ", this.element);
      return;
    }

    e.stopPropagation();
    this.isDragging = true;
    this.dragStartPosition = { x: e.clientX, y: e.clientY };
    this.initialPosition = { x: this.elementX, y: this.elementY };
    this.element.style.cursor = this.onMoveCursor;

    window.addEventListener("mousemove", this.onMove.bind(this));
    window.addEventListener("mouseup", this.onRelease.bind(this));
    this.startRaf();
  }

  onMove(e) {
    if (e.button === this.MOUSE_RIGHT_CLICK) {
      console.debug("FLOW: Ignoreing Right click on", this.element);
      return;
    }
    e.stopPropagation();

    if (!this.isDragging) {
      return;
    }

    const zoom = this.zoomGetter();
    const dx = (e.clientX - this.dragStartPosition.x) / zoom;
    const dy = (e.clientY - this.dragStartPosition.y) / zoom;

    this.elementX = this.initialPosition.x + dx;
    this.elementY = this.initialPosition.y + dy;
  }

  onRelease(e) {
    if (e.button === this.MOUSE_RIGHT_CLICK) {
      console.debug("FLOW: Ignoreing right click on", this.element);
      return;
    }

    e.stopPropagation();
    this.isDragging = false;
    this.element.style.cursor = this.onReleaseCursor;

    window.removeEventListener("mousemove", this.onMove.bind(this));
    window.removeEventListener("mouseup", this.onRelease.bind(this));
  }

  static register(element, onMoveHandler, zoom = 1) {
    const dragHandler = new DragHandler(
      element,
      onMoveHandler,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      zoom
    );
    dragHandler.registerDragEvent();
    return dragHandler;
  }

  startRaf() {
    if (this.rafId) return;

    const loop = () => {
      if (!this.isDragging) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        return;
      }

      // DOM update happens ONLY here
      this.onMoveHandler(this.elementX, this.elementY);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }
}

// Canvas events
const CANVAS_ZOOM_EVENT = "canvas:zoom";

// Node Events
const NODE_REMOVED_EVENT = "node:removed";
const NODE_POINTER_DOWN_EVENT = "node:pointer:down";
const NODE_MOVED_EVENT = "node:moved";
const NODE_SELECTED_EVENT = "node:selected";
const NODE_DESELECTED_EVENT = "node:deselected";
const NODE_DROPPED_EVENT = "node:dropped";
const NODE_UPDATED_EVENT = "node:updated";
const NODE_LABEL_UPDATED_EVENT = "node:label:updated";

const PORT_CONNECT_START_EVENT = "node:port:connect:start";
const PORT_CONNECT_END_EVENT = "node:port:connect:end";

// Connection Events
const CONNECTION_CREATED_EVENT = "connection:created";
const CONNECTION_REMOVED_EVENT = "connection:removed";
const CONNECTION_UPDATED_EVENT = "connection:updated";
const CONNECTION_CLICKED_EVENT = "connection:clicked";

const DEFAULT_CONNECTION_PATH_TYPE = "bezier";

const NODE_CAPABILITIES = {
  SELECTABLE: "selectable",
  MOVABLE: "movable",
  EDITABLE_LABEL: "editable-label",
  RESIZABLE: "resizable",
};

const DEFAULT_SUPPORTED_CAPABILITIES = [
  NODE_CAPABILITIES.SELECTABLE,
  NODE_CAPABILITIES.MOVABLE,
  NODE_CAPABILITIES.EDITABLE_LABEL,
  NODE_CAPABILITIES.RESIZABLE,
];

const SVGShapes = ["ellipse", "circle", "rect", "line", "polyline", "polygon", "path"];

class BaseNodeBehavior {
  constructor({ node, options = {} }) {
    this.node = node;
    this.options = options;
    this.attached = false;
  }

  static get behavior() {
    throw new Error("Static property behavior must be implemented in the subclass");
  }

  isSupported() {
    const iss = this.node.isCapabilitySupported(this.constructor.behavior);
    console.debug("FLOW: Is behavior supported", this.constructor.behavior, iss);
    return iss;
  }

  _attach() {
    if (!this.isSupported()) return;
    if (!this.gaurd()) return;

    this.attach();
    this.attached = true;
    this.node.on(NODE_REMOVED_EVENT, this.destroy);
  }

  gaurd() {
    return true;
  }

  attach() {
    throw new Error("Method 'attach()' must be implemented in the subclass");
  }

  detach() {
    throw new Error("Method 'detach()' must be implemented in the subclass");
  }

  destroy() {
    this.detach();
    this.node.off(NODE_REMOVED_EVENT, this.destroy);
  }
}

class DraggableBehavior extends BaseNodeBehavior {
  static get behavior() {
    return NODE_CAPABILITIES.MOVABLE;
  }

  gaurd() {
    if (typeof this.node.view.move !== "function") {
      console.warn("Node view does not have move method to support draggable behavior");
      return false;
    }
    return true;
  }

  attach() {
    const view = this.node.view;

    this.dragHandler = new DragHandler(
      view.el,
      (x, y) => {
        this.node.move(x, y);
      },
      { x: this.node.x, y: this.node.y },
      { x: 0, y: 0 },
      view.zoomGetter
    );

    this.dragHandler.registerDragEvent();
  }

  detach() {
    this.dragHandler?.destroy();
  }
}

class SelectableBehavior extends BaseNodeBehavior {
  // TODO: this should be removed when multiple nodes can be selected and tabs added.
  static active = null;

  constructor({ node, options = {} }) {
    super({ node, options });
    this.selected = false;
  }

  static get behavior() {
    return NODE_CAPABILITIES.SELECTABLE;
  }

  attach() {
    const view = this.node.view;

    const _onPointerDown = (e) => {
      e.stopPropagation();
      this.select();
    };

    this._onPointerDown = _onPointerDown.bind(this);
    view.el.addEventListener("mousedown", this._onPointerDown);
  }

  select() {
    if (this.selected) return;
    this.constructor.active?.deselect();

    this.selected = true;
    this.node.select();
    this.constructor.active = this;
  }

  deselect() {
    if (!this.node.destroyed) {
      this.node.deselect();
    }
    this.constructor.active = null;
    this.selected = false;
  }

  detach() {
    if (this._onPointerDown && this.node?.view?.el) {
      this.node.view.el.removeEventListener("mousedown", this._onPointerDown);
    }
  }
}

class EditableLabelBehavior extends BaseNodeBehavior {
  static get behavior() {
    return NODE_CAPABILITIES.EDITABLE_LABEL;
  }

  gaurd() {
    const el = this.node.view.el.querySelector(".node-label");
    if (!el) {
      console.warn("Node view does not have label element to support editable label behavior");
      return false;
    }
    this._el = el;
    return true;
  }

  attach() {
    if (!this._el) return;

    const _onDblClick = (e) => {
      e.stopPropagation();
      this._el.contentEditable = "true";
      this._el.focus();
      document.execCommand("selectAll", false, null);
    };

    const _onBlur = () => {
      this._el.contentEditable = "false";
      this.node.model.label = this._el.textContent.trim();
      this.node.emit(NODE_LABEL_UPDATED_EVENT, {
        id: this.node.id,
        label: this.node.model.label,
      });
    };

    const _onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._el.blur();
      }
    };

    this._onDblClick = _onDblClick.bind(this);
    this._onBlur = _onBlur.bind(this);
    this._onKeyDown = _onKeyDown.bind(this);

    this._el.addEventListener("dblclick", this._onDblClick);
    this._el.addEventListener("blur", this._onBlur);
    this._el.addEventListener("keydown", this._onKeyDown);
  }

  detach() {
    if (this._el) {
      this._el.removeEventListener("dblclick", this._onDblClick);
      this._el.removeEventListener("blur", this._onBlur);
      this._el.removeEventListener("keydown", this._onKeyDown);
      this._el = null;
    }
  }
}

class _BehaviorRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(BehaviorClass) {
    const name = BehaviorClass.behavior;
    if (!name) {
      throw new Error(`Behavior ${BehaviorClass.name} must define static behavior`);
    }
    this._registry.set(name, BehaviorClass);
  }

  get(name) {
    return this._registry.get(name);
  }

  getAll() {
    return Array.from(this._registry.values());
  }
}

let BehaviorRegistry = new _BehaviorRegistry();

class ResizableBehavior extends BaseNodeBehavior {
  static get behavior() {
    return NODE_CAPABILITIES.RESIZABLE;
  }

  attach() {
    const el = this.node.view.el;
    const view = this.node.view;

    this.handle = document.createElement("div");
    this.handle.className = "resize-handle resize-br";
    el.appendChild(this.handle);

    this.dragHandler = new DragHandler(
      this.handle,
      (x, y) => {
        const w = Math.max(150, x - this.node.x);
        const h = Math.max(50, y - this.node.y);
        this.node.onResize(w, h);
      },
      { x: this.node.x + this.node.w, y: this.node.y + this.node.h },
      { x: 0, y: 0 },
      view.zoomGetter,
      "nwse-resize",
      "nwse-resize"
    );

    this.dragHandler.registerDragEvent();
  }

  detach() {
    this.handle?.remove();
    this.dragHandler?.destroy();
  }
}

class _PathRegistry {
  constructor() {
    this.paths = new Map();
  }

  register(type, fn) {
    this.paths.set(type, fn);
  }

  get(type) {
    return this.paths.get(type);
  }

  has(type) {
    return this.paths.has(type);
  }
}

let pathRegistry = new _PathRegistry();

// eslint-disable-next-line no-unused-vars
pathRegistry.register("line", ({ p1, p2, options = {} }) => `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);

pathRegistry.register("bezier", ({ p1, p2, options = {} }) => {
  const c = options.curvature ?? 0.7;
  const hx1 = p1.x + Math.abs(p2.x - p1.x) * c;
  const hx2 = p2.x - Math.abs(p2.x - p1.x) * c;

  return `M ${p1.x} ${p1.y}
            C ${hx1} ${p1.y} ${hx2} ${p2.y} ${p2.x} ${p2.y}`;
});

/* eslint-disable no-unused-vars */
pathRegistry.register(
  "orthogonal",
  ({
    p1,
    p2,
    sourceBounds,
    targetBounds,
    sourceDir = "right",
    targetDir = "left",
    options = {},
  }) => {
    // TODO: temporary connections get overlapped with target node, as line generation doesn't aware of target node position
    // fix this later with whole flow context
    const tragetHeight = targetBounds?.height || 50;
    const verticalDirection = options.direction === "vertical" ? true : false;
    const GAP = options.clearance ?? 60;
    const bufferCrossing = 40;

    const pxg = p1.x + GAP;
    const pyg = p1.y + GAP;

    // based on target node position to source node
    // target node is bottom right side.
    const bottom = verticalDirection ? p2.y > pyg + bufferCrossing : p2.y + 1 > p1.y;
    const right = verticalDirection ? p2.x + 1 > p1.x : p2.x > pxg + bufferCrossing;

    const lines = [`M ${p1.x} ${p1.y}`]; // move to source position
    lines.push(`L ${pxg} ${p1.y}`); // create line to source top-right direction

    let hy = Math.abs(p2.y - p1.y); // target node is below/above source node
    let lx = Math.abs(p1.x - p2.x);

    if (bottom) {
      if (right) {
        lines.push(`v ${hy}`); // relative vertical line
        lines.push(`h ${lx - GAP}`); // relative horizontal line
      } else {
        let hy1 = (hy - tragetHeight) * 0.9;
        let hy2 = hy - hy1;
        let lx1 = Math.abs(pxg + bufferCrossing - p2.x);

        lines.push(`v ${hy1}`); // relative vertical line
        lines.push(`h ${-1 * lx1}`); // relative horizontal line
        lines.push(`v ${hy2}`); // relative vertical line
        lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line
      }
    } else {
      if (right) {
        lines.push(`v ${-1 * hy}`); // relative vertical line
        lines.push(`h ${lx - GAP}`); // relative horizontal line
      } else {
        let hy1 = (hy - tragetHeight) * 0.9;
        let hy2 = hy - hy1;
        let lx1 = Math.abs(pxg + bufferCrossing - p2.x);

        lines.push(`v ${-1 * hy1}`); // relative vertical line
        lines.push(`h ${-1 * lx1}`); // relative horizontal line
        lines.push(`v ${-1 * hy2}`); // relative vertical line
        lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line
      }
    }
    return lines.join(" ");
  }
);

/**
 * Base class for all UI components in the library.
 * Provides a standardized lifecycle: constructor -> createContainer -> init -> renderInto.
 * @abstract
 */
class Component {
  /**
   * @param {Object} options
   * @param {string} options.name - The unique name of the component, used to generate the DOM ID.
   */
  constructor({ name }) {
    if (new.target === Component) {
      throw new TypeError("Cannot construct Component instances directly");
    }

    this.name = name;
    this.containerID = this.name
      ? this.name.toLowerCase().replace(/\s+/g, "-")
      : `tab-${Math.random().toString(36).substring(2, 15)}`;
    this.id = this.containerID;
    this.container = null;

    this.created = false;
    this.rendered = false;

    this.parentContainer = null;
    this.onlyChild = null;
  }

  /**
   * Renders the component into a DOM element.
   * @param {HTMLElement|string} container - The element or string ID of the container to render into.
   * @throws {Error} If the container is not found or is invalid.
   */
  renderInto(container, onlyChild = false) {
    this.onlyChild = onlyChild;
    let containerElement;
    if (this.isRendered()) {
      console.warn(`'${this.name}' component is already rendered.`);
      return;
    }

    if (typeof container === "string") {
      containerElement = document.getElementById(container);
      if (!containerElement) {
        throw new Error(`Container with id ${container} not found`);
      }
    } else if (!(container instanceof HTMLElement)) {
      throw new Error("Container must be a valid HTMLElement or a string ID.");
    } else {
      containerElement = container;
    }

    if (!containerElement.id) {
      throw new Error("Container must have a valid id.");
    }

    this.parentContainer = containerElement;
    this.createContainer();

    if (this.onlyChild) {
      this.parentContainer.replaceChildren(this.container);
    } else {
      this.parentContainer.appendChild(this.container);
    }
    console.log("DOM is rendered into container ", containerElement.id);
    this.rendered = true;
  }

  /**
   * Returns the element the component was rendered into.
   * @returns {HTMLElement|null}
   */
  getParentContainer() {
    if (!this.rendered) {
      console.warn(`'${this.name}' component is not rendered yet.`);
      return null;
    }
    return this.parentContainer;
  }

  /**
   * Creates the internal container element and initializes it.
   * @protected
   * @returns {HTMLElement}
   */
  createContainer() {
    if (this.isCreated()) {
      if (this.container) return this.container;

      console.warn(`${this.component} component is already rendered.`);
      return;
    }
    this.container = this.#createAndGetElement();
    this.initContainer();

    return this.container;
  }

  /**
   * Returns the internal container element, creating it if necessary.
   * @returns {HTMLElement}
   */
  getContainer() {
    if (!this.container) {
      this.createContainer();
    }
    return this.container;
  }

  #createAndGetElement() {
    const div = document.createElement("div");
    div.id = this.containerID;
    div.style.height = "100%";
    div.style.width = "100%";

    const template = this.html();

    div.insertAdjacentHTML("beforeend", template);
    return div;
  }

  /**
   * Initializes the component after the container is created.
   * @protected
   */
  initContainer() {
    this.init();
    this.created = true;
  }

  /**
   * Returns whether the component's internal container has been created.
   * @returns {boolean}
   */
  isCreated() {
    return this.created;
  }

  /**
   * Returns whether the component has been rendered into a parent container.
   * @returns {boolean}
   */
  isRendered() {
    return this.rendered;
  }

  /**
   * Abstract method to be implemented by subclasses for initialization logic (e.g., event listeners).
   * @abstract
   */
  init() {
    throw new Error("Method 'init()' must be implemented in the subclass");
  }

  /**
   * Abstract method to be implemented by subclasses to return the HTML template string.
   * @abstract
   * @returns {string}
   */
  html() {
    throw new Error("Method '#html()' must be implemented in the subclass");
  }
}

/**
 * Base class for components that need to emit and listen to custom events.
 * @extends Component
 */
class EmitterComponent extends Component {
  /**
   * @param {Object} options
   * @param {string} options.name - The unique name of the component.
   */
  constructor({ name }) {
    super({ name });
    this.events = {};
  }

  /**
   * Subscribes a handler function to a custom event.
   * @param {string} event - The name of the event.
   * @param {Function} handler - The callback function.
   */
  on(event, handler) {
    (this.events[event] ||= []).push(handler);
  }

  /**
   * Emits a custom event with an optional payload.
   * @param {string} event - The name of the event.
   * @param {*} [payload] - Optional data to pass to handlers.
   */
  emit(event, payload) {
    (this.events[event] || []).forEach((fn) => fn(payload));
  }

  /**
   * Unsubscribes a handler function from an event.
   * @param {string} event - The name of the event.
   * @param {Function} handler - The specific handler function to remove.
   */
  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((fn) => fn !== handler);
  }

  /**
   * Clears all handlers for a specific event, or all events if none specified.
   * @param {string} [event] - The name of the event to clear.
   */
  clear(event) {
    if (event) delete this.events[event];
    else this.events = {};
  }
}

function ensureArrowMarkers(svg, size = 5) {
  if (svg.querySelector("#arrow-end")) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  const makeMarker = (id, pathD) => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", id);
    marker.setAttribute("markerWidth", size);
    marker.setAttribute("markerHeight", size);
    marker.setAttribute("refX", size);
    marker.setAttribute("refY", size / 2);
    marker.setAttribute("orient", "auto");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("fill", "currentColor");

    marker.appendChild(path);
    return marker;
  };

  defs.appendChild(makeMarker("arrow-end", `M 0 0 L ${size} ${size / 2} L 0 ${size} Z`));
  defs.appendChild(makeMarker("arrow-start", `M ${size} 0 L 0 ${size / 2} L ${size} ${size} Z`));

  svg.appendChild(defs);
}

/**
 * Manages the state and logical operations of a Flow.
 * Adheres to SRP by only handling data and logical transformations.
 */
class FlowCanvas extends EmitterComponent {
  constructor({ name, options = {} }) {
    super({ name });

    this.options = options;
    this.zoom = options.zoom || 1;
    this.enableZoomActions = options.enable_zoom_actions || true;
    this.originalZoom = this.zoom;
    this.canvasX = options.canvas?.x || 0;
    this.canvasY = options.canvas?.y || 0;

    this.canvasId = this.id + "-canvas";
    this.containerId = this.id + "-flow-container";
    this.zoomActionsId = this.id + "-zoom-actions";
    this.arrowMarkerSize = options.arrow_marker_size || 7;
    // this.nodeManager = new FlowNodeManager({ name: this.name + "-flow-node-manager", canvasId: this.canvasId, options });
  }

  html() {
    return `
            <div id="${this.canvasId}" 
                class="flow-canvas" 
                style="transform: translate(${this.canvasX}px, ${this.canvasY}px) scale(${this.zoom})">
                <svg id="${this.id}-svg" class="flow-connections"></svg>
            </div>
            ${this.enableZoomActions ? `<div id="${this.zoomActionsId}" class="zoom-actions"></div>` : ""}
        `;
  }

  init() {
    this.containerEl = this.parentContainer;
    this.canvasEl = this.container.querySelector(`#${this.canvasId}`);
    this.svgEl = this.container.querySelector(`#${this.id}-svg`);
    this.container = this.canvasEl;

    // canvas container drag handler
    DragHandler.register(this.containerEl, this.redrawCanvasWithXY.bind(this));

    // passive: false to allow preventDefault to be called. It is false by default except for Safari.
    if (this.enableZoomActions) {
      this.containerEl.addEventListener("wheel", this.onCanvasWheelZoom.bind(this), {
        passive: false,
      });
    }

    // Drop listener for adding new nodes from outside
    this.containerEl.addEventListener("dragover", (e) => e.preventDefault());
    this.containerEl.addEventListener("drop", this.onDrop.bind(this));

    // this.zoomInEl = this.containerEl.querySelector(`#${this.id}-zoomin`);
    // this.zoomOutEl = this.containerEl.querySelector(`#${this.id}-zoomout`);
    // this.zoomResetEl = this.containerEl.querySelector(`#${this.id}-zoomreset`);
    // this.zoomInEl.addEventListener("click", this.onZoomAction.bind(this));
    // this.zoomOutEl.addEventListener("click", this.onZoomAction.bind(this));
    // this.zoomResetEl.addEventListener("click", this.onZoomAction.bind(this));

    ensureArrowMarkers(this.svgEl, this.arrowMarkerSize);
  }

  redrawCanvas() {
    this.redrawCanvasWithXY(this.canvasX, this.canvasY);
  }

  redrawCanvasWithXY(x, y) {
    this.canvasX = x;
    this.canvasY = y;

    this.canvasEl.style.transform = `translate(${x}px, ${y}px) scale(${this.zoom})`;

    // updating grid size (dot dots)
    const gridSize = this.gridFactor * this.zoom;
    this.containerEl.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    this.containerEl.style.backgroundPosition = `${x}px ${y}px`;

    // this.containerEl.style.backgroundImage = `radial-gradient(#c1c1c4 ${1.5 * this.zoom}px, transparent ${1.5 * this.zoom}px)`;
    // this.zoomChangeUpdate();
  }

  // handling mouse left click on port in the node
  onCanvasWheelZoom(e) {
    e.preventDefault();
    console.log("FLOW: Wheel on canvas with deltaY: ", e.deltaY);

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(this.zoom + delta, 3));
    this.zoom = newZoom;
    this.redrawCanvas();
    this.emit(CANVAS_ZOOM_EVENT, {
      data: {
        zoom: this.zoom,
        x: this.canvasX,
        y: this.canvasY,
        delta: delta,
        originalZoom: this.originalZoom,
      },
    });
  }

  onDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const module = e.dataTransfer.getData("module");
      const group = e.dataTransfer.getData("group");
      const name = e.dataTransfer.getData("name");
      const label = e.dataTransfer.getData("label");
      const data = e.dataTransfer.getData("data");

      if (!module || !group || !name) return;

      let nodeData;
      try {
        nodeData = data ? JSON.parse(data) : {};
      } catch (err) {
        console.error("Invalid drop data", err);
        nodeData = {};
      }
      const rect = this.containerEl.getBoundingClientRect();
      const x = e.clientX - rect.left - this.canvasX;
      const y = e.clientY - rect.top - this.canvasY;

      this.emit(NODE_DROPPED_EVENT, { module, group, name, label, x, y, data: nodeData });
      console.debug("FLOW - DROP: ", module, group, name, label, x, y, nodeData);
    } catch (err) {
      console.error("Invalid drop data", err);
    }
  }
}

class Node extends EmitterComponent {
  constructor({ model, view, behaviors = new Set() }) {
    super({ name: `node-${model.id}` });

    this.id = model.id;
    this.name = model.name;
    this.model = model;
    this.view = view;
    this.behaviors = behaviors;
    this.destroyed = false;
  }

  html() {
    return "";
  }

  setBehaviors(behaviors) {
    this.behaviors = behaviors;
  }

  addBehavior(behavior) {
    this.behaviors.add(behavior);
  }

  removeBehavior(behavior) {
    this.behaviors.delete(behavior);
  }

  renderInto(container) {
    this.view.renderInto(container);
  }

  init() {
    this.behaviors.forEach((b) => b._attach());
  }

  move(x, y) {
    this.model.move(x, y);
    this.view.move();
    this.emit(NODE_MOVED_EVENT, { id: this.id, x, y });
  }

  onResize(w, h) {
    const { x, y } = this.model;
    this.model.resize(w, h);
    this.view.resizeNode();
    this.emit(NODE_UPDATED_EVENT, { id: this.id, x, y, w, h });
  }

  destroy() {
    this.behaviors.forEach((b) => b.detach?.());
    this.behaviors.clear();
    this.view.destroy();
    this.view = null;
    this.behaviors = null;
    this.model = null;
    this.destroyed = true;
  }

  isCapabilitySupported(capability) {
    return this.model.capabilities.includes(capability);
  }

  get x() {
    return this.model.x;
  }

  get y() {
    return this.model.y;
  }

  get w() {
    return this.model.w;
  }

  get h() {
    return this.model.h;
  }

  select() {
    this.view.setSelected(true);
    this.emit(NODE_SELECTED_EVENT, { id: this.model.id });
  }

  deselect() {
    this.view.setSelected(false);
    this.emit(NODE_DESELECTED_EVENT, { id: this.model.id });
  }
}

const DEFAULT_SUPPORTED_BEHAVIORS = [
  NODE_CAPABILITIES.SELECTABLE,
  NODE_CAPABILITIES.MOVABLE,
];

class NodeModel {
  constructor({
    id,
    name,
    label,
    module = "default",
    group = "default",
    inputs = 1,
    outputs = 1,
    x = 0,
    y = 0,
    h = 100,
    w = 200,
    data = {},
    capabilities = DEFAULT_SUPPORTED_BEHAVIORS,
  }) {
    this.id = id;
    this.module = module;
    this.group = group;
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.data = data;
    this.capabilities = capabilities;
    this.label = label ?? this.name;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }
}

class NodeViewRegistry {
  constructor() {
    this.views = new Map();
  }

  register(ViewClass) {
    const modelDefaults = ViewClass.modelDefaults;
    this.views.set(
      modelDefaults.module + ":" + modelDefaults.group + ":" + modelDefaults.name,
      ViewClass
    );
  }

  get(module, group, name) {
    return this.views.get(module + ":" + group + ":" + name);
  }
}

const nodeViewRegistry = new NodeViewRegistry();

class BaseNodeView extends EmitterComponent {
  constructor(model, options = {}) {
    if (!(model instanceof NodeModel)) {
      throw new Error("Model must be an instance of NodeModel");
    }
    super({ name: `node-${model.id}` });
    this.model = model;
    this.options = options;
    this.el = null;

    this.contentId = `content-${model.id}`;
    this.zoomGetter = options.zoomGetter || (() => this.options.zoom ?? 1);
    this._content = null;
    this.close = null;
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 200,
      h: 50,
      label: "Node",
      group: "default",
      module: "default",
      capabilities: DEFAULT_SUPPORTED_CAPABILITIES,
      data: {},
    };
  }

  html() {
    this._content = this.getNodeElement();

    if (typeof this._content == "string") {
      return this._content;
    }
    return "";
  }

  init() {
    this.el = this.container;
    this.updateContainerAttributes();
    if (this._content) {
      if (typeof this._content === "string") {
        this.el.innerHTML = this._content;
      } else {
        this.el.appendChild(this._content);
      }
    }
    this.createAllPorts();
    this._bindEvents();
    this.bindEvents();
  }

  updateContainerAttributes() {
    this.container.dataset.id = "node-" + this.model.id;
    this.container.dataset.name = this.model.name;
    this.container.dataset.module = this.model.module;
    this.container.dataset.group = this.model.group;

    this.container.style.top = `${this.model.y}px`;
    this.container.style.left = `${this.model.x}px`;
    this.container.style.width = `${this.model.w}px`;
    this.container.style.height = `${this.model.h}px`;
    this.container.style.position = "absolute";
    this.container.classList.add("flow-node");
  }

  createAllPorts() {
    const inputPorts = this.createPorts({ type: "input", count: this.model.inputs });
    const outputPorts = this.createPorts({ type: "output", count: this.model.outputs });
    const close = this.createClose();

    this.close = close;
    this.el.prepend(inputPorts);
    this.el.appendChild(outputPorts);
    this.el.appendChild(close);
  }

  destroy() {
    this.el?.remove();
    this.el = null;
  }

  propagateEvent(event, instance) {
    instance.on(event, (e) => this.emit(event, e));
  }

  querySelector(selector) {
    return this.el.querySelector(selector);
  }

  setSelected(selected) {
    this.el.classList.toggle("selected", selected);
  }

  move() {
    // https://stackoverflow.com/questions/7108941/css-transform-vs-position
    // Changing transform will trigger a redraw in compositor layer only for the animated element
    // (subsequent elements in DOM will not be redrawn). I want DOM to be redraw to make connection attached to the port.
    // so using position top/left to keep the position intact, not for the animation.
    // I spent hours to find this out with trial and error.

    this.el.style.top = `${this.model.y}px`;
    this.el.style.left = `${this.model.x}px`;
  }

  getPortPosition({ type, index }) {
    if (!this.el) return null;

    const portEl = this.el.querySelector(`.flow-port[data-type="${type}"][data-index="${index}"]`);

    if (!portEl) return null;

    const nodeRect = this.el.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();

    const zoom = typeof this.zoomGetter === "function" ? this.zoomGetter() : 1;

    const x = (portRect.left - nodeRect.left + portRect.width / 2) / zoom;
    const y = (portRect.top - nodeRect.top + portRect.height / 2) / zoom;

    return {
      x: this.model.x + x,
      y: this.model.y + y,
    };
  }

  getBounds() {
    const el = this.el;
    return {
      left: el.offsetLeft,
      top: el.offsetTop,
      right: el.offsetLeft + el.offsetWidth,
      bottom: el.offsetTop + el.offsetHeight,
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  }

  createPorts({ type, count }) {
    const portContainer = document.createElement("div");
    portContainer.className = `flow-ports-column flow-ports-${type}`;

    for (let i = 0; i < count; i++) {
      const port = document.createElement("div");
      port.className = "flow-port";
      port.dataset.type = type;
      port.dataset.index = i;
      port.dataset.nodeId = this.model.id;
      portContainer.appendChild(port);
    }

    return portContainer;
  }

  createClose() {
    const close = document.createElement("button");
    close.className = "btn-danger btn-close node-close border rounded shadow-none m-1";
    close.dataset.nodeId = this.model.id;
    close.setAttribute("aria-label", "Close");
    return close;
  }

  _bindEvents() {
    console.debug("FLOW: Bind events", this.name);
    // node click
    this.bindMouseDown();

    // close button
    this.bindRemoveNode();

    // output ports
    this.bindOutputPorts();

    // input ports
    this.bindInputPorts();
  }

  bindRemoveNode() {
    // close button
    this.el.querySelector(".node-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit(NODE_REMOVED_EVENT, { id: this.model.id });
    });
  }

  bindMouseDown() {
    this.el.addEventListener("mousedown", (e) => {
      this.emit(NODE_POINTER_DOWN_EVENT, { event: e });
    });
  }

  bindInputPorts() {
    this.el.querySelectorAll(".flow-ports-input .flow-port").forEach((port) => {
      port.addEventListener("mouseup", (e) => {
        console.debug("FLOW: Port connect end", e);
        this.emit(PORT_CONNECT_END_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }

  bindOutputPorts() {
    this.el.querySelectorAll(".flow-ports-output .flow-port").forEach((port) => {
      port.addEventListener("mousedown", (e) => {
        console.debug("FLOW: Port connect start", e);
        this.emit(PORT_CONNECT_START_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }

  resizeNode() {
    this.el.style.width = `${this.model.w}px`;
    this.el.style.height = `${this.model.h}px`;
    this.resize?.();
  }

  getNodeElement() {}
  bindEvents() {}
}

class DefaultView extends BaseNodeView {
  constructor(model, options = {}) {
    super(model, options);
  }

  static get name() {
    return "default-node-view";
  }

  getNodeElement() {
    return `
        <div class="node" style="display: grid; place-items: center;">
            <div class="node-label">${this.model.label}</div>
        </div>
    `;
  }
}

class DefaultBehaviorResolver {
  constructor({ registry }) {
    this.registry = registry;
  }

  resolve(node, context = {}) {
    const resolved = new Set();

    node.model.capabilities.forEach((capability) => {
      const BehaviorCls = this.registry.get(capability);
      if (BehaviorCls) {
        resolved.add(new BehaviorCls({ node, options: context }));
      }
    });

    return resolved;
  }
}

class FlowNodeManager extends EmitterComponent {
  constructor({
    name,
    canvasContainer,
    zoomGetter = () => 1,
    View = DefaultView,
    viewRegistry = nodeViewRegistry,
    BehaviorRegistryCls = BehaviorRegistry,
    BehaviorResolverCls = DefaultBehaviorResolver,
  }) {
    super({ name: name + "node-manager" });
    this.canvasContainer = canvasContainer;
    this.zoomGetter = zoomGetter;
    this.View = View;
    this.viewRegistry = viewRegistry;
    this.nodes = new Map();
    this.idCounter = 1;

    this.BehaviorRegistryCls = BehaviorRegistryCls;
    this.BehaviorResolverCls = BehaviorResolverCls;

    this.behaviorResolver = new this.BehaviorResolverCls({ registry: this.BehaviorRegistryCls });
    this.behaviors = [];
  }

  dropNode(config) {
    console.debug("FLOW: Drop node", config);
    this.addNode(config, true);
  }

  addNode(config, isDropped = false) {
    console.debug("FLOW: Add node", config);

    let ViewClass = this.viewRegistry.get(config.module, config.group, config.name);
    if (!ViewClass) {
      console.warn(
        "No nodeview fond for {",
        config.module,
        config.group,
        config.name,
        "}. Using default view."
      );
      ViewClass = this.View;
    }
    const viewDefaults = ViewClass.modelDefaults;

    if (isDropped) {
      // dropping node mid point near to pointer
      const zoom = this.zoomGetter();
      const nodeHeight = config.h ?? viewDefaults.h ?? 100;
      const nodeWidth = config.w ?? viewDefaults.w ?? 200;
      const posX = (config.x - nodeWidth / 2) / zoom;
      const posY = (config.y - nodeHeight / 2) / zoom;
      config.x = posX;
      config.y = posY;
    }

    Object.keys(viewDefaults).forEach((key) => {
      const value = config[key];
      if (value === undefined || value === "undefined") {
        config[key] = viewDefaults[key];
      }
    });

    const node = this.#createNode(config, ViewClass);
    node.renderInto(this.canvasContainer);
    node.init();

    this.nodes.set(node.id, node);
    return node.id;
  }

  #createNode(config, ViewClass) {
    const id = this.idCounter++;

    const model = new NodeModel({ id, ...config });
    const view = new ViewClass(model, { ...this.options, zoomGetter: this.zoomGetter });
    const node = new Node({ model, view });

    const behaviors = this.behaviorResolver.resolve(node, this.options);
    node.setBehaviors(behaviors);

    // bubble view events upward
    this.propagateEvent(PORT_CONNECT_START_EVENT, view);
    this.propagateEvent(PORT_CONNECT_END_EVENT, view);

    this.propagateEvent(NODE_SELECTED_EVENT, view);
    this.propagateEvent(NODE_DESELECTED_EVENT, view);

    this.propagateEvent(NODE_MOVED_EVENT, node);
    this.propagateEvent(NODE_UPDATED_EVENT, node);
    this.propagateEvent(NODE_LABEL_UPDATED_EVENT, node);

    view.on(NODE_REMOVED_EVENT, (e) => this.removeNode(e.id));

    return node;
  }

  removeNode(id) {
    let node = this.getNode(id);
    if (!node) return;

    node.destroy();
    this.nodes.delete(id);
    this.emit(NODE_REMOVED_EVENT, { id });
    node = null;
  }

  propagateEvent(event, instance) {
    instance.on(event, (e) => this.emit(event, e));
  }

  reset() {
    Object.values(this.nodes).forEach((n) => {
      n.destroy();
    });
    this.nodes.clear();
    this.idCounter = 1;
  }

  getNode(id) {
    const n = this.nodes.get(id);
    return n;
  }

  getAllNodes() {
    return [...this.nodes.values()];
  }

  get size() {
    return this.nodes.size;
  }
}

var domStyle = window.getComputedStyle(document.body);

class ConnectionStyle {
  constructor(path, style = {}) {
    this.secondaryColor = domStyle.getPropertyValue("--bs-secondary");
    this.primaryColor = domStyle.getPropertyValue("--bs-primary");
    this.dangerColor = domStyle.getPropertyValue("--bs-danger");

    this.stroke = style.stroke ?? undefined;
    this.width = style.width ?? 2;
    this.dash = style.dash ?? null;
    this.animated = !!style.animated;
    this.path = path ?? DEFAULT_CONNECTION_PATH_TYPE;

    if (!pathRegistry.has(this.path)) {
      console.warn(
        `Path ${this.path} not found. setting to default path type ${DEFAULT_CONNECTION_PATH_TYPE}.`
      );
      this.path = DEFAULT_CONNECTION_PATH_TYPE;
    }

    this.arrows = {
      start: style.arrows?.start ?? false,
      end: style.arrows?.end ?? true,
    };

    // semantic states
    this.bad = false;
    this.hover = false;
    this.selected = false;
    this.temp = false;

    this.execution = style.execution ?? false;
    this.speed = style.execution_speed ?? 2;
  }

  markBad(v = true) {
    this.bad = v;
  }

  markHover(v = true) {
    this.hover = v;
  }

  markSelected(v = true) {
    this.selected = v;
  }

  markTemp(v = true) {
    this.temp = v;
  }

  markExecution(val = true) {
    this.execution = val;
  }

  applyTo(path) {
    if (this.stroke) path.style.stroke = this.stroke;
    path.style.strokeWidth = this.width;
    path.style.strokeDasharray = this.dash ?? "";

    path.classList.toggle("animated", this.animated);
    path.classList.toggle("flow-connection-temp", this.temp);
    path.classList.toggle("flow-connection-path-bad", this.bad);
    path.classList.toggle("selected", this.selected);

    path.classList.toggle("path-hover", this.hover);

    if (this.execution) {
      path.style.strokeDasharray = "6 4";
      path.style.animation = `flow ${1 / this.speed}s linear infinite`;
    } else {
      path.style.strokeDasharray = this.dash ?? "";
      path.style.animation = "";
    }
  }
}

class ConnectionModel extends EmitterComponent {
  constructor({ id, outNodeId, outPort, inNodeId, inPort, options = {} }) {
    super({ name: `connection-${id}` });

    this.id = id;
    this.outNodeId = outNodeId;
    this.outPort = outPort;
    this.inNodeId = inNodeId;
    this.inPort = inPort;

    this.options = options;
    this.style = {
      width: 2,
      dash: null,
      animated: false,
      ...options.style,
    };
    this.style = new ConnectionStyle(this.pathType, this.style);
  }

  get source() {
    return {
      nodeId: this.outNodeId,
      portIndex: this.outPort,
    };
  }

  get target() {
    return {
      nodeId: this.inNodeId,
      portIndex: this.inPort,
    };
  }

  get arrows() {
    return this.style.arrows;
  }

  get pathType() {
    return this.options.pathType ?? DEFAULT_CONNECTION_PATH_TYPE;
  }
}

class ConnectionView extends EmitterComponent {
  #p1 = null;
  #p2 = null;

  constructor({ model, nodeManager, options = {} }) {
    super({ name: `connection-view-${model.id}` });
    this.model = model;
    this.nodeManager = nodeManager;
    this.path = null;
    this.shadowPath = null;

    this.options = options;
    this.container = null;

    this.#p1 = null;
    this.#p2 = null;
    this.adjustEnd = false;
    this.adjustStart = false;
    this.adjustOffset = 6;
    this.endMarker = true;
    this.startMarker = true;
    this.isTemp = options.isTemp ?? false;
  }

  html() {
    return "";
  }

  init() {
    this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.path.classList.add("flow-connection-path", "connection");
    this.path.setAttribute("id", this.model.id);

    this.parentContainer.appendChild(this.path);
    this.container = this.path;

    this.initShadowPath();
    this.bindEvents();

    this.applyArrows();
  }

  static getConnectionKey(outNodeId, outPort, inNodeId, inPort) {
    return `${outNodeId}:${outPort}-${inNodeId}:${inPort}`;
  }

  applyArrows() {
    const arrows = this.model.arrows || {};

    this.endMarker = arrows.end ?? this.endMarker;
    this.startMarker = arrows.start ?? this.startMarker;

    this.path.removeAttribute("marker-start");
    this.path.removeAttribute("marker-end");

    if (this.startMarker) {
      this.adjustStart = true;
      this.path.setAttribute("marker-start", "url(#arrow-start)");
    }

    if (this.endMarker) {
      this.adjustEnd = true;
      this.path.setAttribute("marker-end", "url(#arrow-end)");
    }
  }

  initShadowPath() {
    this.shadowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

    this.shadowPath.classList.add("flow-connection-path", "shadow-path");
    this.shadowPath.setAttribute("id", "shadow-" + this.model.id);

    this.shadowPath.style.stroke = "transparent";
    this.shadowPath.style.strokeWidth = 18;
    this.shadowPath.style.fill = "none";

    // shadow path is not required for temp connection.
    // shadow path stroke width is bigger, as accidental click while drawing connection will be detected and creates issue.
    this.shadowPath.style.pointerEvents = this.isTemp ? "none" : "stroke";

    this.parentContainer.appendChild(this.shadowPath);
  }

  applyStyle() {
    this.model.style.applyTo(this.path);
  }

  #getAdjustedPoints(p1, p2) {
    let adjustedP1 = p1;
    let adjustedP2 = p2;

    if (this.adjustEnd) {
      adjustedP2 = {
        x: p2.x - this.adjustOffset,
        y: p2.y,
      };
    }

    if (this.adjustStart) {
      adjustedP1 = {
        x: p1.x + this.adjustOffset + 16,
        y: p1.y,
      };
    }

    return { p1: adjustedP1, p2: adjustedP2 };
  }

  update(source, target, meta = {}) {
    if (!source || !target) return;

    const p1 = source.view.getPortPosition({
      type: "output",
      index: this.model.source.portIndex,
    });

    const p2 = target.view.getPortPosition({
      type: "input",
      index: this.model.target.portIndex,
    });

    if (!p1 || !p2) return;

    this.#update(p1, p2, meta);
  }

  updateTempPath(p1, p2, meta = {}) {
    this.model.style.markTemp(true);

    this.path.style.pointerEvents = "none";
    this.#update(p1, p2, meta);
  }

  #update(p1, p2, meta = {}) {
    const adjustedPoints = this.#getAdjustedPoints(p1, p2);
    this.updatePath(adjustedPoints.p1, adjustedPoints.p2, meta);
  }

  updatePath(p1, p2, meta = {}) {
    const type = this.model.style.path ?? "bezier";
    this.#p1 = p1 ?? this.#p1;
    this.#p2 = p2 ?? this.#p2;

    const fn = pathRegistry.get(type);

    const d = fn({
      p1: this.#p1,
      p2: this.#p2,
      ...meta,
      zoom: this.options.zoom,
    });

    this.shadowPath.setAttribute("d", d);
    this.path.setAttribute("d", d);
    this.path.setAttribute("p1x", p1.x);
    this.path.setAttribute("p1y", p1.y);
    this.path.setAttribute("p2x", p2.x);
    this.path.setAttribute("p2y", p2.y);

    this.applyStyle();
    this.applyArrows();
  }

  addStyleClass(className) {
    this.path.classList.add(className);
  }

  removeStyleClass(className) {
    this.path.classList.remove(className);
  }

  destroy() {
    this.path?.remove();
    this.shadowPath?.remove();
    this.path = null;
    this.shadowPath = null;
  }

  bindEvents() {
    this.bindSelect();
    this.bindShadowSelect();
  }

  bindSelect() {
    this.path.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit(CONNECTION_CLICKED_EVENT, this.model.id);
    });
  }
  bindShadowSelect() {
    this.shadowPath.addEventListener("mouseover", (e) => {
      e.stopPropagation();
      this.model.style.markHover(true);
      this.applyStyle();
    });
    this.shadowPath.addEventListener("mouseout", (e) => {
      e.stopPropagation();
      this.model.style.markHover(false);
      this.applyStyle();
    });

    this.shadowPath.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit(CONNECTION_CLICKED_EVENT, this.model.id);
    });
  }

  _polyline(points) {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  }
}

class Connection extends EmitterComponent {
  constructor({ model, view, nodeManager }) {
    super({ name: `connection-${model.id}` });

    this.model = model;
    this.view = view;
    this.nodeManager = nodeManager;
    this.destroyed = false;

    this._source = null;
    this._target = null;

    this.id = this.model.id;
  }

  get outNodeId() {
    return this.model.outNodeId;
  }

  get inNodeId() {
    return this.model.inNodeId;
  }

  get inPort() {
    return this.model.inPort;
  }

  get outPort() {
    return this.model.outPort;
  }

  get source() {
    if (!this._source)
      this._source = {
        nodeId: this.model.source.nodeId,
        portIndex: this.model.source.portIndex,
      };
    return this._source;
  }

  get target() {
    if (!this._target)
      this._target = {
        nodeId: this.model.target.nodeId,
        portIndex: this.model.target.portIndex,
      };
    return this._target;
  }

  renderInto(container) {
    this.view.renderInto(container);
    this.init();
  }

  init() {
    this.update();
  }

  update() {
    const sourceNode = this.nodeManager.getNode(this.model.source.nodeId);
    const targetNode = this.nodeManager.getNode(this.model.target.nodeId);
    const meta = {
      sourceBounds: sourceNode.view.getBounds(),
      targetBounds: targetNode?.view.getBounds(),
    };
    this.view.update(sourceNode, targetNode, meta);
  }

  updateWithXY(x, y) {
    const sourceNode = this.nodeManager.getNode(this.source.nodeId);

    if (!sourceNode) return;

    const p1 = sourceNode.view.getPortPosition({
      type: "output",
      index: this.source.portIndex,
    });

    const p2 = { x, y };

    const meta = {
      sourceBounds: sourceNode.view.getBounds(),
    };

    this.view.updateTempPath(p1, p2, meta);
  }

  markBadPath() {
    this.model.style.markBad(true);
    this.view.applyStyle();
  }

  destroy() {
    this.view.destroy();
    this.view = null;
    this.model = null;
    this.nodeManager = null;
    this.destroyed = true;
  }

  clearBadPath() {
    this.model.style.markBad(false);
    this.view.applyStyle();
  }

  setPathStyle(pathType) {
    this.model.pathType = pathType;
    this.view.updatePath();
  }
}

class FlowConnectionManager extends EmitterComponent {
  constructor({ name, connectionContainer, nodeManager, options = {} }) {
    super({ name: name + "-flow-connection-manager", options });
    this.connectionContainer = connectionContainer;
    this.nodeManager = nodeManager;
    this.options = options;
    this.zoom = options.zoom || 1;
    this.originalZoom = this.zoom;

    this.nodeIdCounter = 1;
    this.nodeWidth = options.nodeWidth || 200;
    this.nodeHeight = options.nodeHeight || 90;

    this.connections = new Map();
    this.tempConnection = null;
    this.badConnections = new Set();
  }

  addConnection(outNodeId, outPort, inNodeId, inPort, pathType = undefined) {
    const id = ConnectionView.getConnectionKey(outNodeId, outPort, inNodeId, inPort);
    const connection = this.#createConnection({
      id,
      outNodeId,
      outPort,
      inNodeId,
      inPort,
      pathType,
      isTemp: false,
    });
    this.connections.set(id, connection);
    return connection;
  }

  beginTempConnection(outNodeId, outPort, pathType = undefined) {
    const connection = this.#createConnection({
      id: "temp",
      outNodeId,
      outPort,
      inNodeId: null,
      inPort: null,
      pathType,
      isTemp: true,
    });
    this.tempConnection = connection;
    return connection;
  }

  #createConnection({
    id,
    outNodeId,
    outPort,
    inNodeId,
    inPort,
    pathType = undefined,
    isTemp = false,
  }) {
    const _pathType =
      pathType ?? this.options?.connection?.path_type ?? DEFAULT_CONNECTION_PATH_TYPE;

    const connectionOptions = { ...this.options?.connection, pathType: _pathType };

    const model = new ConnectionModel({
      id,
      outNodeId,
      outPort,
      inNodeId,
      inPort,
      options: connectionOptions,
    });
    const view = new ConnectionView({
      model,
      options: { ...connectionOptions, isTemp: isTemp },
    });
    const connection = new Connection({
      model,
      view,
      nodeManager: this.nodeManager,
      options: connectionOptions,
    });
    connection.renderInto(this.connectionContainer.id);

    view.on(CONNECTION_CLICKED_EVENT, (id) => {
      this.removeConnection(id);
    });
    return connection;
  }

  reset() {
    this.connections.forEach((conn) => conn.destroy());
    this.connections.clear();
    this.clearTempPath?.();
  }

  updateConnections(nodeId) {
    const _nodeId = parseInt(nodeId);
    // eslint-disable-next-line no-unused-vars
    this.connections.forEach((conn, id) => {
      if (conn.source.nodeId === _nodeId || conn.target.nodeId === _nodeId) {
        conn.update();
        this.emit(CONNECTION_UPDATED_EVENT, conn);
      }
    });
  }

  updateTempConnection(mouseX, mouseY) {
    if (!this.tempConnection) return;

    this.clearBadPaths();
    this.tempConnection.updateWithXY(mouseX, mouseY);
  }

  removeConnection(id) {
    const conn = this.getConnection(id);
    this.emit(CONNECTION_REMOVED_EVENT, id);
    this.connections.delete(id);
    conn?.destroy();
  }

  removeRelatedConnections(nodeId) {
    this.connections.forEach((conn, id) => {
      if (conn.source.nodeId === nodeId || conn.target.nodeId === nodeId) {
        this.removeConnection(id);
      }
    });
  }

  endTempConnection() {
    this.clearTempPath();
    this.tempConnection = null;
  }

  // bad connection path (cyclic in DAG) will be cleared on below scenario
  // 1. drawing new (temp) connection
  // 2. cancel drawing connection this.keyDownCancelConnection
  clearTempPath() {
    this.clearBadPaths();
    if (this.tempConnection) {
      this.tempConnection.destroy();
      this.tempConnection = null;
    }
  }

  markTempPathBad() {
    if (!this.tempConnection) return;

    this.markPathBad(this.tempConnection);
  }

  markPathBad(conn) {
    conn.markBadPath();
    this.badConnections.add(conn);
  }

  clearBadPaths() {
    this.badConnections.forEach((conn) => {
      conn.clearBadPath();
    });
    this.badConnections.clear();
  }

  getZoom() {
    return this.zoom;
  }

  getAllConnections() {
    return [...this.connections.values()];
  }

  getConnection(id) {
    return this.connections.get(id);
  }

  get size() {
    return this.connections.size;
  }
}

class FlowSerializer {
  export(flow) {
    const nodeManager = flow.nodeManager;
    const connectionManager = flow.connectionManager;
    const canvas = flow.canvas;

    const nodes = [];
    nodeManager.getAllNodes().forEach((node) => {
      nodes.push(node.model);
    });

    const connections = [];
    connectionManager.getAllConnections().forEach((node) => {
      connections.push(node.model);
    });

    return {
      nodes,
      connections,
      zoom: canvas.zoom,
      canvas: {
        x: canvas.canvasX,
        y: canvas.canvasY,
      },
    };
  }
  import(flow, data) {
    const { nodeManager, connectionManager, canvas } = flow;

    // 1. Reset canvas
    const zoom = data.zoom || 1;
    flow.zoom = zoom;
    canvas.zoom = zoom;
    nodeManager.zoom = zoom;
    connectionManager.zoom = zoom;

    canvas.canvasX = data.canvas?.x || 0;
    canvas.canvasY = data.canvas?.y || 0;
    canvas.redrawCanvas();

    // 2. Reset managers
    nodeManager.reset?.();
    connectionManager.reset?.();

    // 3. Recreate nodes
    if (data.nodes) {
      data.nodes.forEach((n) => {
        nodeManager.addNode(n);
      });
    }

    // 4. Recreate connections (validators already active)
    if (data.connections) {
      data.connections.forEach((c) => {
        flow.addConnection(c.outNodeId, c.outPort, c.inNodeId, c.inPort);
      });
    }
  }
}

/**
 * A lightweight Flow/Node editor component inspired by Drawflow, and freeform.
 * features: zoom, pan, draggable nodes, input/output ports, bezier connections.
 * @extends EmitterComponent
 */
class Flow extends EmitterComponent {
  /**
   * @param {Object} options
   * @param {string} options.name - Unique name for the flow instance.
   * @param {Object} [options.options] - Configuration options.
   * @param {number} [options.options.zoom=1] - Initial zoom level.
   * @param {Object} [options.options.canvas={x:0, y:0}] - Initial pan position.
   */
  constructor({ name, options = {}, validators = [], notification = null }) {
    super({ name });

    this.options = options;
    this.validators = validators;
    this.notification = notification;
    this.serializer = new FlowSerializer();
    this.zoom = options.zoom || 1;
    this.originalZoom = this.zoom;

    this.nodes = {}; // { id: { id, x, y, inputs, outputs, data, el } }
    // this.connections = []; // [ { outputNodeId, outputPort, inputNodeId, inputPort } ]
    this.nodeIdCounter = 1;

    // DOM References
    this.canvasEl = null;
    this.svgEl = null;

    this.nodeManager = null;
    this.connectionManager = null;
    this.rafId = null;
    this.isConnecting = false;
  }

  /**
   * Returns component HTML structure.
   */
  html() {
    return "";
  }

  init() {
    this.container.classList.add("floxy-flow-container");

    this.canvas = new FlowCanvas({
      name: this.name + "-canvas",
      options: this.options,
    });

    this.canvas.renderInto(this.container);

    this.containerEl = this.container;
    this.canvasEl = this.canvas.canvasEl;
    this.svgEl = this.canvas.svgEl;

    this.nodeManager = new FlowNodeManager({
      name: this.name + "-flow-node-manager",
      canvasContainer: this.canvasEl,
      zoomGetter: () => this.zoom,
      options: this.options,
    });

    this.connectionManager = new FlowConnectionManager({
      name: this.name + "-flow-connection-manager",
      connectionContainer: this.svgEl,
      nodeManager: this.nodeManager,
      options: this.options,
    });

    this.canvas.on(CANVAS_ZOOM_EVENT, ({ data }) => {
      this.zoom = data.zoom;
      this.connectionManager.zoom = data.zoom;
      this.nodeManager.zoom = data.zoom;
    });

    this.canvas.on(NODE_DROPPED_EVENT, (config) => {
      console.debug("Node is dropped: ", config);
      this.emit(NODE_DROPPED_EVENT, config);
      this.nodeManager.dropNode(config);
    });

    this.nodeManager.on(NODE_MOVED_EVENT, ({ id, x, y }) => {
      this.emit(NODE_MOVED_EVENT, { id, x, y });
      this.connectionManager.updateConnections(id);
    });

    this.nodeManager.on(NODE_UPDATED_EVENT, ({ id, x, y, w, h }) => {
      this.emit(NODE_UPDATED_EVENT, { id, x, y, w, h });
      this.connectionManager.updateConnections(id);
    });

    this.nodeManager.on(NODE_REMOVED_EVENT, ({ id }) => {
      console.debug("Node is removed: ", id);
      this.emit(NODE_REMOVED_EVENT, { id });
      this.removeNode(id);
    });

    this.nodeManager.on(PORT_CONNECT_START_EVENT, ({ nodeId, portIndex, event }) => {
      console.debug("Port connect start: ", nodeId, portIndex, event);
      this.mouseDownStartConnection({ dataset: { index: portIndex } }, nodeId, event);
    });

    this.nodeManager.on(PORT_CONNECT_END_EVENT, ({ nodeId, portIndex, event }) => {
      console.debug("Port connect end: ", nodeId, portIndex, event);
      this.mouseUpCompleteConnection({ dataset: { index: portIndex } }, nodeId, event);
    });

    this.connectionManager.on(CONNECTION_CREATED_EVENT, (connection) => {
      console.debug("Connection is created: ", connection);
      this.emit(CONNECTION_CREATED_EVENT, connection);

      this.validators.forEach((v) =>
        v.onConnectionAdded?.({
          outNodeId: connection.outNodeId,
          inNodeId: connection.inNodeId,
        })
      );
    });

    this.connectionManager.on(CONNECTION_CLICKED_EVENT, (connection) => {
      console.debug("Connection is clicked: ", connection);
      this.emit(CONNECTION_CLICKED_EVENT, connection);
      this.connectionManager.removeConnection(connection);
    });

    this.connectionManager.on(CONNECTION_REMOVED_EVENT, (connection) => {
      console.debug("Connection is removed: ", connection);
      this.emit(CONNECTION_REMOVED_EVENT, connection);

      this.validators.forEach((v) =>
        v.onConnectionRemoved?.({
          outNodeId: connection.outNodeId,
          inNodeId: connection.inNodeId,
        })
      );
    });
  }

  highlightCycle(stack) {
    if (!stack || stack.length < 2) return;

    console.log("FLOW: highlight cycle", stack);
    // TODO: need to fix O(n^2) time complexity
    for (let pos = 0; pos < stack.length - 1; pos++) {
      const conn = this.connectionManager
        .getAllConnections()
        .find((c) => c.outNodeId === stack[pos] && c.inNodeId === stack[pos + 1]);
      if (conn) this.connectionManager.markPathBad(conn);
    }
  }

  /**
   * Add a new node to the flow.
   * @param {Object} params
   * @param {string} params.name - Title of node.
   * @param {number} params.inputs - Number of input ports.
   * @param {number} params.outputs - Number of output ports.
   * @param {number} params.x - X position.
   * @param {number} params.y - Y position.
   * @param {string} params.html - Inner HTML content.
   * @returns {number} The new node ID.
   */
  addNode(params) {
    return this.nodeManager.addNode(params);
  }

  mouseDownStartConnection(port, nodeId, event) {
    console.debug("FLOW: Start connection from port: ", port, "nodeId: ", nodeId);
    event.stopPropagation();
    this.isConnecting = true;
    this.connectionStart = { nodeId, index: port.dataset.index };
    this.connectionManager.beginTempConnection(nodeId, port.dataset.index);
    // Use addEventListener instead of window.onmousemove to avoid JSDOM redefinition errors
    this._drawConnection = (e) => this.mouseMoveDrawConnection(port, nodeId, e);
    this._cancelConnection = (e) => this.keyDownCancelConnection(e, nodeId);
    window.addEventListener("mousemove", this._drawConnection);
    window.addEventListener("keydown", this._cancelConnection);

    this.startRaf(() => {
      const samePreviousPos =
        this.connectionStart.prevX == this.connectionStart.x &&
        this.connectionStart.prevY == this.connectionStart.y;
      if (this.connectionStart.x && this.connectionStart.y && !samePreviousPos) {
        this.connectionStart.prevX = this.connectionStart.x;
        this.connectionStart.prevY = this.connectionStart.y;
        this.connectionManager.updateTempConnection(this.connectionStart.x, this.connectionStart.y);
      }
    });
  }

  mouseMoveDrawConnection(port, nodeId, event) {
    if (this.isConnecting) {
      if (!this._canvasRect) {
        this._canvasRect = this.canvasEl.getBoundingClientRect();
      }
      const rect = this._canvasRect;
      const x = (event.clientX - rect.left) / this.zoom;
      const y = (event.clientY - rect.top) / this.zoom;

      this.connectionManager.updateTempConnection(x, y);
      this.connectionStart.x = x;
      this.connectionStart.y = y;
    }
  }

  mouseUpCompleteConnection(port, nodeId, event) {
    if (this.isConnecting) {
      // Check if dropped on local input port
      const target = event.target.closest(".flow-port");
      if (target && target.dataset.type === "input") {
        const inputNodeId = parseInt(target.dataset.nodeId);
        const inputIndex = parseInt(target.dataset.index);
        const connected = this.addConnection(
          this.connectionStart.nodeId,
          this.connectionStart.index,
          inputNodeId,
          inputIndex,
          event,
          nodeId
        );
        if (connected) this.connectionManager.endTempConnection();
      }
    }
  }

  addConnection(outNodeId, outPort, inNodeId, inPort, event = null, nodeId = null) {
    // const connected = this.connectionManager.addConnection(outNodeId, outPort, inNodeId, inPort);
    // if (event && connected) this.keyDownCancelConnection(event, nodeId);
    // return connected;

    for (const validator of this.validators) {
      const result = validator.onConnectionAttempt({ outNodeId, inNodeId });
      if (!result.valid) {
        this.notification?.warning(result.message);
        this.connectionManager.markTempPathBad();

        if (result.stack) {
          this.highlightCycle(result.stack);
        }
        return false;
      }
    }

    const created = this.connectionManager.addConnection(outNodeId, outPort, inNodeId, inPort);

    if (created) {
      this.validators.forEach((v) => v.onConnectionAdded?.({ outNodeId, inNodeId }));
      if (event) this.keyDownCancelConnection(event, nodeId);
    }

    return created;
  }

  // eslint-disable-next-line no-unused-vars
  keyDownCancelConnection(event, nodeId) {
    // ESCAPE key pressed
    if (event.type == "keydown" && event.key !== "Escape" && event.keyCode !== 27) {
      return;
    }

    this.isConnecting = false;
    this.connectionManager.endTempConnection();

    if (this._drawConnection) {
      window.removeEventListener("mousemove", this._drawConnection);
      window.removeEventListener("keydown", this._cancelConnection);
      this._drawConnection = null;
    }
  }

  removeNode(nodeId) {
    this.connectionManager.removeRelatedConnections(nodeId);
  }

  export() {
    return this.serializer.export(this);
  }

  import(data) {
    this.serializer.import(this, data);
  }

  startRaf(rafn) {
    if (this.rafId) return;

    const loop = () => {
      if (!this.isConnecting) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this._canvasRect = null;
        return;
      }

      // DOM update happens ONLY here
      rafn();
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    this.isConnecting = false;

    if (this._drawConnection) {
      window.removeEventListener("mousemove", this._drawConnection);
      window.removeEventListener("keydown", this._cancelConnection);
    }

    cancelAnimationFrame(this.rafId);
  }
}

/**
 * FlowValidator plugin contract
 */
/* eslint-disable no-unused-vars */
class FlowValidator {
  onConnectionAttempt({ outNodeId, inNodeId }) {
    return { valid: true };
  }

  onConnectionAdded({ outNodeId, inNodeId }) {}
  onConnectionRemoved({ outNodeId, inNodeId }) {}
}

class DagValidator extends FlowValidator {
  constructor({ enabled = true } = {}) {
    super();
    this.enabled = enabled;
    this.adjacencyList = {};
    this.nonCyclicCache = {};
    this.tempCyclicCache = {};
    this.tempStackCache = {};
  }

  onConnectionAttempt({ outNodeId, inNodeId }) {
    const message = "This connection will create cyclic flow.";
    if (!this.enabled) return { valid: true };

    const cacheKey = `${outNodeId}->${inNodeId}`;

    if (this.nonCyclicCache[cacheKey] !== undefined) {
      return { valid: !this.nonCyclicCache[cacheKey] };
    }

    if (this.tempCyclicCache[cacheKey]) {
      return { valid: false, stack: this.tempStackCache[cacheKey], message };
    }

    this.tempStackCache[cacheKey] = [];
    const stack = this.tempStackCache[cacheKey];
    const visited = new Set();

    let virtualNeighbors = new Set(this.adjacencyList[outNodeId] || new Set());
    virtualNeighbors.add(inNodeId);

    visited.add(outNodeId);
    stack.push(outNodeId);

    for (const neighbor of virtualNeighbors) {
      if (this.#isCyclic(neighbor, visited, stack)) {
        this.tempCyclicCache[cacheKey] = true;
        return { valid: false, stack, message };
      }
    }

    return { valid: true };
  }

  onConnectionAdded({ outNodeId, inNodeId }) {
    this.#addNodeToAdjacencyList(outNodeId, inNodeId);

    // add to cache only when we make a connection
    // if the connection is cyclic, connection from the graph can be removed and updated again to create new connection.
    this.#addConnNonCyclicCache(outNodeId, inNodeId);
  }

  onConnectionRemoved({ outNodeId, inNodeId }) {
    const cacheKey = `${outNodeId}->${inNodeId}`;
    this.adjacencyList[outNodeId]?.delete(inNodeId);
    delete this.nonCyclicCache[cacheKey];

    // remove all temporary cyclic cache.
    // This is partial fix for now, as we need to traverse the graph to remove the affected temporary connection cache.
    // Efficient when no connections are removed to make a DAG.
    this.tempCyclicCache = {};
  }

  #addNodeToAdjacencyList(outNodeId, inNodeId) {
    if (!this.adjacencyList[outNodeId]) this.adjacencyList[outNodeId] = new Set();
    this.adjacencyList[outNodeId].add(inNodeId);
  }

  #addConnNonCyclicCache(outNodeId, inNodeId) {
    const cacheKey = `${outNodeId}->${inNodeId}`;
    this.nonCyclicCache[cacheKey] = false;
    delete this.tempStackCache[cacheKey];
  }

  #isCyclic(node, visited, stack) {
    if (stack.includes(node)) {
      // cycle found
      // adding last node to stack to show the cycle in the UI
      stack.push(node);
      return true;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    stack.push(node);

    for (const neighbor of this.adjacencyList[node] || []) {
      if (this.#isCyclic(neighbor, visited, stack)) return true;
    }

    stack.pop();
    return false;
  }
}

class SVGNodeView extends BaseNodeView {
  constructor(model, options = {}) {
    super(model, options);
    this.shapeName = "svg";
    this.shape = null;
    this.label = null;
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 200,
      h: 100,
      label: "SVG",
      module: "default",
      group: "default",
      name: "svg",
      capabilities: DEFAULT_SUPPORTED_CAPABILITIES,
      data: {},
    };
  }

  getNodeElement() {
    const el = document.createElement("div");
    el.className = `flow-node ${this.shapeName}-node`;

    // SVG shape
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("node");

    this.shape = this.createShape();
    this.label = this.createLabel();

    this.shape.classList.add("shape");
    svg.appendChild(this.shape);

    el.appendChild(svg);
    el.appendChild(this.label);

    return el;
  }

  init() {
    super.init();
    this.resize();
  }

  createLabel() {
    const content = document.createElement("div");
    content.classList.add("node-label");
    content.setAttribute("contenteditable", false);
    content.textContent = this.model.label;
    return content;
  }

  createShape() {
    if (!SVGShapes.includes(this.shapeName)) {
      throw new Error(`Can not create give ${this.shapeName} svg shape`);
    }

    const shape = document.createElementNS("http://www.w3.org/2000/svg", this.shapeName);
    return shape;
  }

  resize() {
    throw new Error("Method 'resize()' must be implemented in the subclass");
  }
}

const SUPPORTED_CAPABILITIES = [
  NODE_CAPABILITIES.MOVABLE,
  NODE_CAPABILITIES.EDITABLE_LABEL,
  NODE_CAPABILITIES.RESIZABLE,
  NODE_CAPABILITIES.SELECTABLE,
];

class EllipseNodeView extends SVGNodeView {
  constructor(model, options = {}) {
    super(model, options);
    this.shapeName = "ellipse";
    this.ellipse = null;
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 200,
      h: 100,
      label: "Action",
      module: "diagram",
      group: "workflow",
      name: "action",
      capabilities: SUPPORTED_CAPABILITIES,
      data: {},
    };
  }

  createShape() {
    const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    this.ellipse = ellipse;
    return this.ellipse;
  }

  updateShape() {}

  resize() {
    const { w, h } = this.model;
    const rx = (w - 1) / 2;
    const ry = (h - 1) / 2;
    this.ellipse.setAttribute("cx", rx);
    this.ellipse.setAttribute("cy", ry);
    this.ellipse.setAttribute("rx", rx);
    this.ellipse.setAttribute("ry", ry);
  }
}

BehaviorRegistry.register(DraggableBehavior);
BehaviorRegistry.register(SelectableBehavior);
BehaviorRegistry.register(EditableLabelBehavior);
BehaviorRegistry.register(ResizableBehavior);

nodeViewRegistry.register(EllipseNodeView);

exports.DagValidator = DagValidator;
exports.Flow = Flow;
