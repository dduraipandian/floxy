class BaseCapability {
  constructor({ options = {} }) {
    this.options = options;
  }

  static get capability() {
    throw new Error("Static property capability must be implemented in the subclass");
  }

  isSupported(target) {
    const iss = target.isCapabilitySupported(this.constructor.capability);
    console.debug("FLOW: Is behavior supported", this.constructor.capability, iss);
    return iss;
  }
}

class BaseBehavior extends BaseCapability {
  constructor({ component, options = {} }) {
    super(options);
    this.component = component;
    this.manager = options.manager;
    this.attached = false;
  }

  static get removal_event() {
    throw new Error("Static property removal_event must be implemented in the subclass");
  }

  _attach() {
    if (!this.isSupported(this.component)) return;
    if (!this.gaurd()) return;

    this.attach();
    this.attached = true;
    this.component.on(this.constructor.removal_event, this.destroy);
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
    this.component.off(this.constructor.removal_event, this.destroy);
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
const CONNECTION_SELECTED_EVENT = "connection:selected";
const CONNECTION_DESELECTED_EVENT = "connection:deselected";

const DEFAULT_CONNECTION_PATH_TYPE = "bezier";

const COMMON_CAPABILITIES = {
  SELECTABLE: "selectable",
};

const CAPABILITIES = {
  MOVABLE: "movable",
  EDITABLE_LABEL: "editable-label",
  RESIZABLE: "resizable",
  REMOVABLE: "removable",
};

const DEFAULT_SUPPORTED_CAPABILITIES = [
  COMMON_CAPABILITIES.SELECTABLE,
  CAPABILITIES.MOVABLE,
  CAPABILITIES.EDITABLE_LABEL,
  CAPABILITIES.RESIZABLE,
  CAPABILITIES.REMOVABLE,
];

const DEFAULT_SUPPORTED_CONNECTION_CAPABILITIES = [
  COMMON_CAPABILITIES.SELECTABLE,
  CAPABILITIES.REMOVABLE,
];

const SVGShapes = ["ellipse", "circle", "rect", "line", "polyline", "polygon", "path"];

const COMMAND_CAPABILITIES = {
  Delete: CAPABILITIES.REMOVABLE,
  Backspace: CAPABILITIES.REMOVABLE,
};

let GLOABL_ACTIVE = null;

function setActive(behavior) {
  GLOABL_ACTIVE = behavior;
}

function getActive() {
  return GLOABL_ACTIVE;
}

class CommonSelectableBehavior extends BaseBehavior {
  // TODO: this should be removed when multiple nodes can be selected and tabs added.

  constructor({ component, options = {} }) {
    super({ component, options });
    this.selected = false;
  }

  static get capability() {
    return COMMON_CAPABILITIES.SELECTABLE;
  }

  attach() {
    const view = this.component.view;

    const _onPointerDown = (e) => {
      e.stopPropagation();
      this.select(e.clientX, e.clientY);
    };

    this._onPointerDown = _onPointerDown.bind(this);
    view.attachEvent("click", this._onPointerDown);
  }

  select(cx, cy) {
    if (getActive() === this) return;

    getActive()?.deselect();

    this.selected = true;
    this.component.select(cx, cy);
    setActive(this);
  }

  deselect() {
    if (!this.component.destroyed) {
      this.component.deselect();
    }
    setActive(null);
    this.selected = false;
  }

  detach() {
    if (this._onPointerDown && this.component?.view?.el) {
      this.component.view.detachEvent("click", this._onPointerDown);
    }
  }

  static get select_event() {
    throw new Error("Static property select_event must be implemented in the subclass");
  }

  static get deselect_event() {
    throw new Error("Static property deselect_event must be implemented in the subclass");
  }
}

class SelectableBehavior$1 extends CommonSelectableBehavior {
  constructor({ component, options = {} }) {
    super({ component, options });
    this.connection = this.component;
  }

  static get capability() {
    return COMMON_CAPABILITIES.SELECTABLE;
  }

  static get removal_event() {
    return CONNECTION_REMOVED_EVENT;
  }

  static get select_event() {
    return CONNECTION_SELECTED_EVENT;
  }

  static get deselect_event() {
    return CONNECTION_DESELECTED_EVENT;
  }
}

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

class CapabilityRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(CapabilityClass) {
    const name = CapabilityClass.capability;
    if (!name) {
      throw new Error(`Capability ${CapabilityClass.name} must define static capability`);
    }
    this._registry.set(name, CapabilityClass);
  }

  get(name) {
    return this._registry.get(name);
  }

  getAll() {
    return Array.from(this._registry.values() || []);
  }

  resolve(component, context = {}) {
    // context will be used to create resolved instances.
    // for example, Behavior requires state of the component. so it requires component and options to be passed to constructor.
    // so context will be { component, options }
    // Command does not require state of the component. So it does not require component to be passed to constructor.
    // resolver will not know the what type of instance is required. So it will create instance using the context.
    const resolved = new Set();

    component.model.capabilities?.forEach((capability) => {
      const CapabilityCls = this.get(capability);
      if (CapabilityCls) {
        const capabilityInstance = new CapabilityCls(context);
        console.log("capabilityInstance", capabilityInstance);
        resolved.add(capabilityInstance);
      }
    });

    return resolved;
  }
}

class NodeCapability extends BaseBehavior {
  constructor({ component, options = {} }) {
    super({ component, options });
    this.node = this.component;
  }

  static get removal_event() {
    return NODE_REMOVED_EVENT;
  }
}

const defaultBehaviorRegistry$1 = new CapabilityRegistry();
const defaultCommandRegistry$1 = new CapabilityRegistry();

class DraggableBehavior extends NodeCapability {
  static get capability() {
    return CAPABILITIES.MOVABLE;
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

class SelectableBehavior extends CommonSelectableBehavior {
  constructor({ component, options = {} }) {
    super({ component, options });
    this.node = this.component;
  }

  static get capability() {
    return COMMON_CAPABILITIES.SELECTABLE;
  }

  static get removal_event() {
    return NODE_REMOVED_EVENT;
  }

  static get select_event() {
    return NODE_SELECTED_EVENT;
  }

  static get deselect_event() {
    return NODE_DESELECTED_EVENT;
  }
}

class EditableLabelBehavior extends NodeCapability {
  static get capability() {
    return CAPABILITIES.EDITABLE_LABEL;
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

class ResizableBehavior extends NodeCapability {
  static get capability() {
    return CAPABILITIES.RESIZABLE;
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

class BaseCommand extends BaseCapability {
  static get capability() {
    throw new Error("Static property capability must be implemented in the subclass");
  }

  get clearSelection() {
    return false;
  }

  canExecute(component) {
    return this.isSupported(component);
  }

  run(flow, manager, component) {
    if (!this.canExecute(component)) {
      flow.notification?.error(`${this.constructor.capability} is not supported`);
      return false;
    }
    return this.execute(flow, manager, component);
  }

  // eslint-disable-next-line no-unused-vars
  execute(flow, manager, component) {
    throw new Error("Method 'execute()' must be implemented in the subclass");
  }

  static get label() {
    return this.capability;
  }
  static get order() {
    return 0;
  }
  static get icon() {
    return "";
  }
  static get toolclass() {
    return "";
  }
}

class RemovableCommand extends BaseCommand {
  static get capability() {
    return "removable";
  }

  get clearSelection() {
    return true;
  }

  execute(flow, manager, component) {
    manager.remove(component.id);
    return true;
  }

  static get label() {
    return "Delete";
  }
  static get order() {
    return 100;
  }
  static get icon() {
    return '<i class="bi bi-trash"></i>';
  }
  static get toolclass() {
    return "btn-danger";
  }
}

const defaultBehaviorRegistry = new CapabilityRegistry();
const defaultCommandRegistry = new CapabilityRegistry();

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
    path.setAttribute("fill", "context-stroke");

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
    this.zoomRafId = null;
    this.targetZoom = this.zoom;
    this.zoomEase = options.zoom_ease || 0.15;
    this.minZoom = 0.1;
    this.maxZoom = 3;
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
  }

  // handling mouse left click on port in the node
  onCanvasWheelZoom(e) {
    e.preventDefault();
    console.log("FLOW: Wheel on canvas with deltaY: ", e.deltaY);

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.targetZoom = Math.max(this.minZoom, Math.min(this.zoom + delta, this.maxZoom));
    this.zoomRaf();
  }

  handleZoomChange(zoom) {
    this.zoom = zoom;
    this.redrawCanvas();
    this.emitZoomEvent();
  }

  emitZoomEvent() {
    this.emit(CANVAS_ZOOM_EVENT, {
      data: {
        zoom: this.zoom,
        x: this.canvasX,
        y: this.canvasY,
        originalZoom: this.originalZoom,
      },
    });
  }

  zoomRaf() {
    if (this.zoomRafId) return;

    const loop = () => {
      const diff = this.targetZoom - this.zoom;
      if (Math.abs(diff) < 0.001) {
        cancelAnimationFrame(this.zoomRafId);
        this.zoomRafId = null;
        return;
      }

      const targetZoom = this.zoom + diff * this.zoomEase;
      this.handleZoomChange(targetZoom);
      this.zoomRafId = requestAnimationFrame(loop);
    };

    this.zoomRafId = requestAnimationFrame(loop);
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
    this.behaviors.forEach((b) => {
      try {
        b._attach();
      } catch (error) {
        console.error("Failed to attach behavior", b, error);
      }
    });
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

  get label() {
    return this.model.label;
  }

  select(cx, cy) {
    this.view.setSelected(true);
    this.emit(NODE_SELECTED_EVENT, { id: this.model.id, cx, cy });
  }

  deselect() {
    this.view.setSelected(false);
    this.emit(NODE_DESELECTED_EVENT, { id: this.model.id });
  }
}

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
    capabilities = DEFAULT_SUPPORTED_CAPABILITIES,
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
      w: 250,
      h: 70,
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
    // this.el.appendChild(close);
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

  attachEvent(event, callback) {
    this.el.addEventListener(event, callback);
  }

  detachEvent(event, callback) {
    this.el.removeEventListener(event, callback);
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

class FlowNodeManager extends EmitterComponent {
  constructor({
    name,
    canvasContainer,
    zoomGetter = () => 1,
    View = DefaultView,
    viewRegistry = nodeViewRegistry,
    behaviorRegistry = defaultBehaviorRegistry$1,
  }) {
    super({ name: name + "node-manager" });
    this.canvasContainer = canvasContainer;
    this.zoomGetter = zoomGetter;
    this.View = View;
    this.viewRegistry = viewRegistry;
    this.nodes = new Map();
    this.idCounter = 1;

    this.behaviorRegistry = behaviorRegistry;
    this.type = "node";
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

    const behaviors = this.behaviorRegistry.resolve(node, {
      component: node,
      options: this.options,
    });
    node.setBehaviors(behaviors);

    // bubble view events upward
    this.propagateEvent(PORT_CONNECT_START_EVENT, view);
    this.propagateEvent(PORT_CONNECT_END_EVENT, view);

    this.propagateEvent(NODE_SELECTED_EVENT, node);
    this.propagateEvent(NODE_DESELECTED_EVENT, node);

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

  remove(id) {
    this.removeNode(id);
  }

  propagateEvent(event, instance) {
    console.debug("FLOW: Propagate event", event, instance);
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

class ConnectionStyle {
  constructor(path, style = {}) {
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
  constructor({
    id,
    outNodeId,
    outPort,
    inNodeId,
    inPort,
    capabilities = DEFAULT_SUPPORTED_CONNECTION_CAPABILITIES,
    options = {},
  }) {
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
    this.capabilities = capabilities;
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
    // this.bindEvents();

    this.applyArrows();
    this.el = this.path;
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
    this.bindShadowSelect();
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
  }

  getBounds() {
    const el = this.el;
    if (!el) return null;

    const len = el.getTotalLength();
    const point = el.getPointAtLength(len / 2);

    const svg = el.ownerSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = point.x;
    pt.y = point.y;

    const screenPoint = pt.matrixTransform(el.getScreenCTM());

    return {
      centerX: screenPoint.x,
      centerY: screenPoint.y,
    };
  }

  setSelected(selected) {
    this.model.style.markSelected(selected);
    this.applyStyle();
  }

  attachEvent(event, callback) {
    this.path.addEventListener(event, callback);
    this.shadowPath.addEventListener(event, callback);
  }

  detachEvent(event, callback) {
    this.path.removeEventListener(event, callback);
    this.shadowPath.removeEventListener(event, callback);
  }
}

class Connection extends EmitterComponent {
  constructor({ model, view, nodeManager, behaviors = new Set() }) {
    super({ name: `connection-${model.id}` });

    this.model = model;
    this.view = view;
    this.nodeManager = nodeManager;
    this.destroyed = false;

    this._source = null;
    this._target = null;

    this.behaviors = behaviors;
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
    this.attachBehaviors();
    console.log("Connection init", this.behaviors);
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

  select(cx, cy) {
    this.view.setSelected(true);
    this.emit(CONNECTION_SELECTED_EVENT, { id: this.model.id, cx, cy });
  }

  deselect() {
    this.view.setSelected(false);
    this.emit(CONNECTION_DESELECTED_EVENT, { id: this.model.id });
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

  attachBehaviors() {
    this.behaviors.forEach((b) => {
      try {
        b._attach();
      } catch (error) {
        console.error("Failed to attach behavior", b, error);
      }
    });
  }

  isCapabilitySupported(capability) {
    return this.model.capabilities.includes(capability);
  }
}

class FlowConnectionManager extends EmitterComponent {
  constructor({
    name,
    connectionContainer,
    nodeManager,
    behaviorRegistry = defaultBehaviorRegistry,
    options = {},
  }) {
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

    this.behaviorRegistry = behaviorRegistry;
    this.type = "connection";
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

    const behaviors = this.behaviorRegistry.resolve(connection, {
      component: connection,
      options: connectionOptions,
    });
    connection.setBehaviors(behaviors);

    connection.renderInto(this.connectionContainer.id);

    connection.on(CONNECTION_SELECTED_EVENT, (e) => {
      this.emit(CONNECTION_SELECTED_EVENT, e);
    });

    connection.on(CONNECTION_DESELECTED_EVENT, (e) => {
      this.emit(CONNECTION_DESELECTED_EVENT, e);
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

  remove(id) {
    this.removeConnection(id);
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

class SelectionToolbar extends EmitterComponent {
  constructor({ selection, options = {} }) {
    super({ name: "floxy-selection-toolbar" });
    this.selection = selection;
    this.options = options;
    this.x = null;
    this.y = null;
  }

  html() {
    return `
        <div id="floxy-selection-toolbar-btn-group" class="btn-group btn-group-sm floxy-selection-toolbar" role="group" aria-label="floxy flow toolbar">
        </div>`;
  }

  init() {
    this.container = this.container.querySelector("#floxy-selection-toolbar-btn-group");
    this.updateView();
  }

  updateView() {
    this.container.innerHTML = this.html();

    this.container.style.zIndex = "1000";
    this.container.style.height = "fit-content";

    if (!this.selection.active) {
      this.container.style.display = "none";
      return;
    }

    this.container.style.display = "block";
    this.container.style.position = "absolute";

    const commands = [...this.selection.commands];

    commands
      .sort((a, b) => (a.constructor.order ?? 0) - (b.constructor.order ?? 0))
      .forEach((cmd) => {
        const btn = document.createElement("button");
        btn.classList.add("btn");
        if (cmd.constructor.icon) btn.innerHTML = cmd.constructor.icon;
        else btn.textContent = cmd.constructor.label;
        if (cmd.constructor.toolclass) btn.classList.add(cmd.constructor.toolclass);
        else btn.classList.add("btn-outline-secondary");
        btn.onclick = () => {
          const success = this.selection.execute(cmd.constructor.capability);
          if (success && cmd.clearSelection) this.updateView();
        };

        this.container.appendChild(btn);
      });
    this.position();
  }

  position() {
    const bounds = this.selection.getBounds();
    if (!bounds) return;

    if (this.selection.cx) {
      const x = this.selection.cx;
      const y = this.selection.cy + 16;

      // connection
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
    } else {
      // node
      const btnGroupWidth = this.container.offsetWidth;
      this.container.style.left = `${bounds.left + bounds.width / 2 - btnGroupWidth / 2 + 5}px`;
      this.container.style.top = `${bounds.top + bounds.height + 16}px`;
    }
  }

  hide() {
    this.container.style.display = "none";
  }

  show() {
    this.container.style.display = "block";
  }
}

class Selection {
  constructor(flow, options = {}) {
    this.flow = flow;
    this.options = options;
    this.component = null;
    this.manager = null;
    this.commands = new Set();
    this.cx = null;
    this.cy = null;
    this.notification = options.notification;
  }

  get active() {
    return this.component !== null && this.manager !== null;
  }

  set(component, manager, commandRegistry, cx, cy) {
    this.manager = manager;
    this.component = component;
    this.cx = cx;
    this.cy = cy;
    this.commands = commandRegistry.resolve(component, { options: this.options });
  }

  clear() {
    this.component = null;
    this.manager = null;
    this.cx = null;
    this.cy = null;
    this.commands = new Set();
  }

  execute(capability) {
    let success = false;
    console.debug("Executing capability: ", capability, this.commands);
    const cmd = [...this.commands].find((c) => c.constructor.capability === capability);
    if (cmd) {
      success = cmd?.run(this.flow, this.manager, this.component);
      if (success && cmd.clearSelection) {
        this.clear();
      }
    } else {
      this.notification?.error(`${this.component?.label} is not ${capability}.`);
    }
    return success;
  }

  getBounds() {
    if (!this.component?.view?.getBounds) return null;
    return this.component.view.getBounds();
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
  constructor({
    name,
    options = {},
    validators = [],
    notification = null,
    nodeCommandRegistry = defaultCommandRegistry$1,
    connectionCommandRegistry = defaultCommandRegistry,
    selectionManagerCls = Selection,
  }) {
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
    this.commands = new Set();
    this.activeSelection = null;
    this.nodeCommandRegistry = nodeCommandRegistry;
    this.connectionCommandRegistry = connectionCommandRegistry;
    this.selectionManager = new selectionManagerCls(this, { notification: this.notification });
    this.toolbar = null;

    this.zoomInEl = null;
    this.zoomOutEl = null;
    this.zoomResetEl = null;
  }

  /**
   * Returns component HTML structure.
   */
  html() {
    return `<ul class="list-group list-group-horizontal-sm zoom-actions" style="width: fit-content;">
                  <a href="#" class="list-group-item list-group-item-action zoom-item" id="${this.id}-zoomin" data-action="zoomin"><i class="bi bi-plus-lg"></i></a>                  
                  <a href="#" class="list-group-item list-group-item-action zoom-item" id="${this.id}-zoomreset" data-action="zoomreset"><i class="bi bi-justify"></i></a>
                  <a href="#" class="list-group-item list-group-item-action zoom-item" id="${this.id}-zoomout" data-action="zoomout"><i class="bi bi-dash-lg"></i></a>
                </ul>`;
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

    this.zoomInEl = this.containerEl.querySelector(`#${this.id}-zoomin`);
    this.zoomOutEl = this.containerEl.querySelector(`#${this.id}-zoomout`);
    this.zoomResetEl = this.containerEl.querySelector(`#${this.id}-zoomreset`);
    this.zoomInEl.addEventListener("click", this.onZoomAction.bind(this));
    this.zoomOutEl.addEventListener("click", this.onZoomAction.bind(this));
    this.zoomResetEl.addEventListener("click", this.onZoomAction.bind(this));

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
      this.zoomChangeUpdate();
    });

    this.nodeManager.on(NODE_SELECTED_EVENT, ({ id, cx, cy }) => {
      const node = this.nodeManager.getNode(id);
      this.emit(NODE_SELECTED_EVENT, { id, cx, cy });
      this.selectionManager.set(node, this.nodeManager, this.nodeCommandRegistry);
      this.toolbar.updateView();
    });

    // eslint-disable-next-line no-unused-vars
    this.nodeManager.on(NODE_DESELECTED_EVENT, ({ id }) => {
      this.selectionManager.clear();
      this.toolbar.updateView();
    });

    this.connectionManager.on(CONNECTION_SELECTED_EVENT, ({ id, cx, cy }) => {
      console.debug("Connection is selected: ", id);
      this.emit(CONNECTION_SELECTED_EVENT, { id, cx, cy });
      const connection = this.connectionManager.getConnection(id);
      if (!this._canvasRect) {
        this._canvasRect = this.canvasEl.getBoundingClientRect();
      }
      const x = (cx - this._canvasRect.left) / this.zoom;
      const y = (cy - this._canvasRect.top) / this.zoom;
      this.selectionManager.set(
        connection,
        this.connectionManager,
        this.connectionCommandRegistry,
        x,
        y
      );
      this.toolbar.updateView();
    });

    // eslint-disable-next-line no-unused-vars
    this.connectionManager.on(CONNECTION_DESELECTED_EVENT, ({ id }) => {
      this.selectionManager.clear();
      this.toolbar.updateView();
    });

    this.canvas.on(NODE_DROPPED_EVENT, (config) => {
      console.debug("Node is dropped: ", config);
      this.emit(NODE_DROPPED_EVENT, config);
      this.nodeManager.dropNode(config);
    });

    this.nodeManager.on(NODE_MOVED_EVENT, ({ id, x, y }) => {
      this.emit(NODE_MOVED_EVENT, { id, x, y });
      this.connectionManager.updateConnections(id);
      this.toolbar.hide();
    });

    this.nodeManager.on(NODE_UPDATED_EVENT, ({ id, x, y, w, h }) => {
      this.emit(NODE_UPDATED_EVENT, { id, x, y, w, h });
      this.connectionManager.updateConnections(id);
      this.toolbar.hide();
    });

    this.nodeManager.on(NODE_REMOVED_EVENT, ({ id }) => {
      console.debug("Node is removed: ", id);
      this.emit(NODE_REMOVED_EVENT, { id });
      this.removeNode(id);
      this.toolbar.updateView();
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
    this.bindCommandEvents();

    this.toolbar = new SelectionToolbar({ selection: this.selectionManager });
    this.toolbar.renderInto(this.canvasEl);
  }

  bindCommandEvents() {
    window.addEventListener("keydown", (e) => {
      console.log("Key pressed: ", e.key);
      const capability = COMMAND_CAPABILITIES[e.key];
      if (capability && this.selectionManager.active) {
        const success = this.selectionManager.execute(capability);
        if (success) this.toolbar.updateView();
      }
    });
  }

  onZoomAction(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action;
    switch (action) {
      case "zoomin":
        this.zoom += 0.1;
        break;
      case "zoomout":
        this.zoom -= 0.1;
        break;
      case "zoomreset":
        this.zoom = this.originalZoom;
        break;
    }
    this.canvas.handleZoomChange(this.zoom);
  }

  zoomChangeUpdate() {
    if (this.zoom === this.originalZoom) {
      this.zoomInEl.classList.remove("active");
      this.zoomOutEl.classList.remove("active");
    } else if (this.zoom > this.originalZoom) {
      this.zoomInEl.classList.add("active");
      this.zoomOutEl.classList.remove("active");
    } else {
      this.zoomInEl.classList.remove("active");
      this.zoomOutEl.classList.add("active");
    }
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

class ThemeManager {
  constructor(root = document.documentElement) {
    this.root = root;
    // Set default grid type if not present
    if (!this.root.hasAttribute("data-floxy-grid-type")) {
      this.root.setAttribute("data-floxy-grid-type", "dots");
    }

    // Initialize Global Theme
    const savedTheme = localStorage.getItem("floxy-theme") || "system";
    this.setGlobalTheme(savedTheme);
  }

  getGlobalTheme() {
    return this.root.getAttribute("data-floxy-theme") || "light";
  }

  setGlobalTheme(theme) {
    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    this.root.setAttribute("data-floxy-theme", effectiveTheme);
    localStorage.setItem("floxy-theme", theme); // Store user preference (including 'system')
  }

  setToken(name, value) {
    this.root.style.setProperty(`--floxy-${name}`, value);

    // Update data attribute for grid type switching logic in CSS
    if (name === "grid-type") {
      this.root.setAttribute("data-floxy-grid-type", value);
    }
  }

  setTheme(theme) {
    Object.entries(theme).forEach(([k, v]) => {
      this.setToken(k, v);
    });
  }

  getToken(name) {
    if (name === "global-theme") {
      return localStorage.getItem("floxy-theme") || "system";
    }
    return getComputedStyle(this.root).getPropertyValue(`--floxy-${name}`).trim();
  }
}

class ThemeEditor extends EmitterComponent {
  constructor(options = {}) {
    super({ name: "flow-theme-editor" });
    this.manager = options.manager || new ThemeManager();
    this.isOpen = false;
    this.config = [
      {
        category: "Global Appearance",
        tokens: [
          {
            name: "global-theme",
            label: "Color Theme",
            type: "select",
            options: [
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
              { label: "System", value: "system" },
            ],
          },
        ],
      },
      {
        category: "Brand Colors",
        group: true,
        tokens: [
          { name: "primary-color", label: "Primary", type: "color" },
          { name: "secondary-color", label: "Secondary", type: "color" },
          { name: "danger-color", label: "Danger", type: "color" },
          { name: "warning-color", label: "Warning", type: "color" },
          { name: "info-color", label: "Info", type: "color" },
        ],
      },
      {
        category: "Nodes",
        tokens: [
          { name: "node-bg", label: "Background", type: "color" },
          { name: "node-border", label: "Border", type: "color" },
          {
            name: "node-border-width",
            label: "Border Width",
            type: "range",
            min: 0,
            max: 10,
            unit: "px",
          },
          {
            name: "node-radius",
            label: "Corner Radius",
            type: "range",
            min: 0,
            max: 50,
            unit: "px",
          },
          { name: "node-focus-color", label: "Selected Color", type: "color" },
          {
            name: "node-focus-width",
            label: "Selected Width",
            type: "range",
            min: 0,
            max: 10,
            unit: "px",
          },
        ],
      },
      {
        category: "Labels",
        tokens: [
          { name: "label-color", label: "Text Color", type: "color" },
          {
            name: "label-font-size",
            label: "Font Size",
            type: "range",
            min: 8,
            max: 24,
            unit: "px",
          },
        ],
      },
      {
        category: "Ports",
        tokens: [
          { name: "port-size", label: "Size", type: "range", min: 4, max: 20, unit: "px" },
          {
            name: "port-radius",
            label: "Corner Radius",
            type: "range",
            min: 0,
            max: 50,
            unit: "%",
          },
          { name: "port-bg", label: "Input Background", type: "color" },
          { name: "port-output-bg", label: "Output Background", type: "color" },
          { name: "port-border", label: "Border", type: "color" },
        ],
      },
      {
        category: "Connections",
        tokens: [
          { name: "conn-color", label: "Color", type: "color" },
          { name: "conn-width", label: "Width", type: "range", min: 1, max: 10, unit: "px" },
          { name: "conn-hover-color", label: "Hover Color", type: "color" },
          { name: "conn-selected-color", label: "Selected Color", type: "color" },
          { name: "conn-bad-color", label: "Bad Color", type: "color" },
        ],
      },
      {
        category: "Grid",
        tokens: [
          {
            name: "grid-type",
            label: "Type",
            type: "select",
            options: [
              { label: "Dots", value: "dots" },
              { label: "Lines", value: "lines" },
            ],
          },
          { name: "grid-dot-color", label: "Dot Color", type: "color" },
          {
            name: "grid-dot-size",
            label: "Dot Size",
            type: "range",
            min: 10,
            max: 100,
            unit: "px",
          },
          {
            name: "grid-dot-radius",
            label: "Dot Radius",
            type: "range",
            min: 0.5,
            max: 5,
            step: 0.1,
            unit: "px",
          },
          { name: "grid-line-color", label: "Line Color", type: "color" },
          {
            name: "grid-line-size",
            label: "Line Size",
            type: "range",
            min: 10,
            max: 100,
            step: 10,
            unit: "px",
          },
          {
            name: "grid-line-width",
            label: "Line Width",
            type: "range",
            min: 1,
            max: 5,
            unit: "px",
          },
        ],
      },
    ];
  }

  html() {
    return `      
            <button class="floxy-toggle-btn" id="floxy-theme-toggle" title="Customize Theme">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.185 1.184l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.184 1.185l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.291.16c-.764.415-1.6-.42-1.185-1.184l.159-.292a1.873 1.873 0 0 0-1.116-2.692l-.318-.094c-.835-.246-.835-1.428 0-1.674l.319-.094a1.873 1.873 0 0 0 1.115-2.693l-.16-.291c-.415-.764.42-1.6 1.184-1.185l.292.159a1.873 1.873 0 0 0 2.692-1.116l.094-.318z"/>
                </svg>
            </button>
            <div class="floxy-theme-editor swag" id="floxy-theme-panel">
                <div class="floxy-theme-header">
                    <h5 class="m-0 fw-bold" style="font-size: 0.95rem; color: var(--floxy-label-color);">Theme Editor</h5>
                    <button type="button" class="btn-close" id="floxy-theme-close" style="font-size: 0.7rem; opacity: 0.6; color: var(--floxy-node-text);"></button>
                </div>
                <div class="floxy-theme-body">
                    ${this.renderTokenControl()}
                </div>
                <div class="floxy-theme-footer">
                    <button class="btn btn-sm btn-primary flex-grow-1 py-2" id="floxy-download-theme">Download Theme</button>
                    <button class="btn btn-sm btn-outline-secondary flex-grow-1 py-2" id="floxy-export-css">Copy CSS</button>
                    <button class="btn btn-sm btn-link w-100 mt-2" id="floxy-theme-reset" style="font-size: 0.75rem; text-decoration: none;  color: var(--floxy-secondary-color)">Reset Defaults</button>
                </div>
            </div>
        `;
  }

  render() {
    this.container.innerHTML = this.html();
    this.attachEvents();
  }

  init() {
    this.render();
  }

  renderTokenControl() {
    return this.config
      .map(
        (section) => `
            <div class="floxy-theme-section">
              ${this.#getCategory(section)}
            </div>
          `
      )
      .join("");
  }

  #getCategory(section) {
    const group = section.group ?? false;
    let html = `<h6>${section.category}</h6>`;
    if (group) {
      html += '<div style="display: flex; gap: 8px; flex-wrap: wrap;">';
      section.tokens.forEach((token) => {
        const currentValue = this.manager.getToken(token.name);
        html += `<input type="color" title="${token.label}" class="floxy-color-input" data-token="${token.name}" value="${this.rgbToHex(currentValue)}">`;
      });
      html += "</div>";
      return html;
    }
    html += `${section.tokens.map((token) => this.#getTokenControl(token)).join("")}`;
    return html;
  }

  #getTokenControl(token) {
    if (token.type === "color") {
      return this.#getColorTokenControl(token);
    } else if (token.type === "range") {
      return this.#getRangeTokenControl(token);
    } else if (token.type === "select") {
      return this.#getSelectTokenControl(token);
    }
  }

  #getColorTokenControl(token) {
    const currentValue = this.manager.getToken(token.name);
    return `
        <div class="floxy-token-row">
          <span class="floxy-token-label">${token.label}</span>
          <input type="color" class="floxy-color-input" data-token="${token.name}" value="${this.rgbToHex(currentValue)}">
        </div>
      `;
  }

  #getRangeTokenControl(token) {
    const currentValue = this.manager.getToken(token.name);
    const numericValue = parseFloat(currentValue) || 0;
    return `
        <div class="floxy-token-row" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="floxy-token-label">${token.label}</span>
            <span class="floxy-range-value" id="val-${token.name}">${currentValue}</span>
          </div>
          <input type="range" class="form-range floxy-range-input" 
            data-token="${token.name}" 
            data-unit="${token.unit || ""}"
            min="${token.min}" max="${token.max}" step="${token.step || 1}" 
            value="${numericValue}">
        </div>
      `;
  }

  #getSelectTokenControl(token) {
    const currentValue = this.manager.getToken(token.name) || token.options[0].value;
    return `
        <div class="floxy-token-row">
          <span class="floxy-token-label">${token.label}</span>
          <select class="form-select form-select-sm floxy-select-input w-50" data-token="${token.name}" style="font-size: 0.75rem;">
            ${token.options.map((opt) => `<option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>${opt.label}</option>`).join("")}
          </select>
        </div>
      `;
  }

  attachEvents() {
    const panel = this.container.querySelector("#floxy-theme-panel");
    const toggle = this.container.querySelector("#floxy-theme-toggle");
    const close = this.container.querySelector("#floxy-theme-close");
    const reset = this.container.querySelector("#floxy-theme-reset");
    const exportBtn = this.container.querySelector("#floxy-export-css");
    const downloadBtn = this.container.querySelector("#floxy-download-theme");

    toggle.onclick = () => {
      this.isOpen = !this.isOpen;
      panel.classList.toggle("open", this.isOpen);
    };

    close.onclick = () => {
      this.isOpen = false;
      panel.classList.remove("open");
    };

    panel.querySelectorAll("input, select").forEach((input) => {
      const handler = (e) => {
        const token = e.target.dataset.token;
        const unit = e.target.dataset.unit || "";
        const value = e.target.value + unit;

        if (token === "global-theme") {
          this.manager.setGlobalTheme(e.target.value);
        } else {
          this.manager.setToken(token, value);
        }

        const valDisplay = this.container.querySelector(`#val-${token}`);
        if (valDisplay) valDisplay.textContent = value;
      };

      input.oninput = handler;
      input.onchange = handler;
    });

    reset.onclick = (e) => {
      e.preventDefault();
      if (confirm("Reset all theme variables to defaults?")) {
        window.location.reload();
      }
    };

    exportBtn.onclick = () => {
      let css = ":root {\n";
      this.config.forEach((section) => {
        section.tokens.forEach((token) => {
          css += `  --floxy-${token.name}: ${this.manager.getToken(token.name)};\n`;
        });
      });
      css += "}";

      navigator.clipboard.writeText(css).then(() => {
        const originalText = exportBtn.textContent;
        exportBtn.textContent = "Copied!";
        exportBtn.classList.add("btn-success");
        exportBtn.classList.remove("btn-outline-secondary");
        setTimeout(() => {
          exportBtn.textContent = originalText;
          exportBtn.classList.remove("btn-success");
          exportBtn.classList.add("btn-outline-secondary");
        }, 2000);
      });
    };

    downloadBtn.onclick = () => {
      let css = "/* Generated by Floxy Theme Editor */\n:root {\n";
      this.config.forEach((section) => {
        section.tokens.forEach((token) => {
          css += `  --floxy-${token.name}: ${this.manager.getToken(token.name)};\n`;
        });
      });
      css += "}";

      const blob = new Blob([css], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "floxy-theme.css";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  // Helper to convert rgb(r, g, b) to #rrggbb
  rgbToHex(col) {
    if (col.startsWith("#")) return col;
    const rgb = col.match(/\d+/g);
    if (!rgb || rgb.length < 3) return "#000000";
    return (
      "#" +
      rgb
        .slice(0, 3)
        .map((x) => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
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
      w: 250,
      h: 150,
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
  CAPABILITIES.MOVABLE,
  CAPABILITIES.EDITABLE_LABEL,
  CAPABILITIES.RESIZABLE,
  CAPABILITIES.SELECTABLE,
  CAPABILITIES.REMOVABLE,
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
      w: 250,
      h: 150,
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

defaultBehaviorRegistry$1.register(DraggableBehavior);
defaultBehaviorRegistry$1.register(SelectableBehavior);
defaultBehaviorRegistry$1.register(EditableLabelBehavior);
defaultBehaviorRegistry$1.register(ResizableBehavior);

defaultCommandRegistry$1.register(RemovableCommand);

defaultBehaviorRegistry.register(SelectableBehavior$1);
defaultCommandRegistry.register(RemovableCommand);

nodeViewRegistry.register(EllipseNodeView);

export { DagValidator, Flow, ThemeEditor, ThemeManager };
