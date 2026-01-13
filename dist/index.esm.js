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

class DragHandler {
  constructor(
    element,
    onMoveHandler,
    initialPosition = { x: 0, y: 0 },
    startDragPosition = { x: 0, y: 0 },
    zoom = 1
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
    this.element.style.cursor = "grabbing";

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
    this.element.style.cursor = "grab";

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

    this.containerEl.style.backgroundImage = `radial-gradient(#c1c1c4 ${1.5 * this.zoom}px, transparent ${1.5 * this.zoom}px)`;
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
    this.emit("canvas:zoom", {
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
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;

      const data = JSON.parse(raw);
      const rect = this.containerEl.getBoundingClientRect();
      const x = e.clientX - rect.left - this.canvasX;
      const y = e.clientY - rect.top - this.canvasY;

      // this.addNode({
      //     name: data.name,
      //     inputs: data.inputs,
      //     outputs: data.outputs,
      //     x,
      //     y,
      //     html: data.html,
      // });
      this.emit("node:dropped", { data: { x, y, ...data } });
      console.debug("FLOW - DROP: ", data, x, y);
    } catch (err) {
      console.error("Invalid drop data", err);
    }
  }
}

const NODE_MOVED_EVENT = "node:moved";
const NODE_DROPPED_EVENT = "node:dropped";
const NODE_REMOVED_EVENT = "node:removed";

// Connection Events
const CONNECTION_CREATED_EVENT = "connection:created";
const CONNECTION_REMOVED_EVENT = "connection:removed";
const CONNECTION_UPDATED_EVENT = "connection:updated";
const CONNECTION_CLICKED_EVENT = "connection:clicked";

// eslint-disable-next-line no-unused-vars
class FlowNode extends EmitterComponent {
  constructor({ nodeId, inputs = 1, outputs = 1, x = 0, y = 0, html = "", options = {} }) {
    super({ name: `node-${nodeId}` });

    this.x = x;
    this.y = y;
    this.nodeId = nodeId;
    this.inputs = inputs;
    this.outputs = outputs;
    this.contentHtml = html;
    this.options = options;
  }
}

class FlowNodeManager extends EmitterComponent {
  constructor({ name, canvasContainer, options = {} }) {
    super({ name: name + "-flow-node-manager" });
    this.options = options;
    this.zoom = options.zoom || 1;
    this.originalZoom = this.zoom;

    this.nodes = {};
    this.nodeIdCounter = 1;
    this.nodeWidth = options.nodeWidth || 200;
    this.nodeHeight = options.nodeHeight || 90;
    this.selectedNodeId = null;
    this.canvasContainer = canvasContainer;
  }

  dropNode(data) {
    const posX = (data.x - this.nodeWidth / 2) / this.zoom;
    const posY = (data.y - this.nodeHeight / 2) / this.zoom;
    this.addNode({ ...data, x: posX, y: posY });
  }

  addNode({ name, inputs = 1, outputs = 1, x = 0, y = 0, html = "" }) {
    const id = this.nodeIdCounter++;
    const node = { id, name, inputs, outputs, x, y, contentHtml: html };

    this.nodes[id] = node;
    this.renderNode(node);
    return id;
  }

  renderNode(node) {
    const el = document.createElement("div");
    const inputHtml = `<div class="flow-port" data-type="input" data-node-id="${node.id}" data-index="{{index}}"></div>`;
    const outputHtml = `<div class="flow-port" data-type="output" data-node-id="${node.id}" data-index="{{index}}"></div>`;

    const nodeHtml = `
        <div id="node-${node.id}" 
            data-id="${node.id}" 
            class="flow-node rounded" 
            style="top: ${node.y}px; left: ${node.x}px; 
                    width: ${this.nodeWidth}px; height: fit-content">                        
            <div class="flow-ports-column flow-ports-in">
                ${Array.from({ length: node.inputs }, (_, i) => inputHtml.replace("{{index}}", i)).join("\n")}
            </div>
            <div class="flow-node-content card w-100">              
              <div class="card-header">${node.name}</div>
              <div class="card-body">${node.contentHtml}</div>              
            </div>            
            <div class="flow-ports-column flow-ports-out">                
                ${Array.from({ length: node.outputs }, (_, i) => outputHtml.replace("{{index}}", i)).join("\n")}
            </div>
            <button type="button" 
                data-id="${node.id}"
                class="btn-danger btn-close node-close border rounded shadow-none m-1" 
                aria-label="Close">
            </button>
        </div>
        `;
    el.innerHTML = nodeHtml;

    const nodeEl = el.querySelector(`#node-${node.id}`);

    nodeEl.onclick = (e) => this.onNodeClick(e, node.id);
    nodeEl.onmousedown = (e) => this.onNodeClick(e, node.id);

    // register drap handler
    const hl = new DragHandler(
      nodeEl,
      this.redrawNodeWithXY.bind(this, node.id),
      {
        x: this.nodes[node.id].x,
        y: this.nodes[node.id].y,
      },
      { x: 0, y: 0 },
      () => this.zoom
    );
    hl.registerDragEvent();

    nodeEl
      .querySelector("button.node-close")
      .addEventListener("click", (e) => this.removeNode(e, node.id));

    nodeEl.querySelectorAll(".flow-ports-out .flow-port").forEach((port) => {
      port.onmousedown = (e) => {
        this.emit("port:connect:start", {
          nodeId: node.id,
          portIndex: port.dataset.index,
          event: e,
        });
      };
    });

    nodeEl.querySelectorAll(".flow-ports-in .flow-port").forEach((port) => {
      port.onmouseup = (e) => {
        this.emit("port:connect:end", {
          nodeId: node.id,
          portIndex: port.dataset.index,
          event: e,
        });
      };
    });

    this.nodes[node.id].el = nodeEl;
    this.canvasContainer.appendChild(nodeEl);
  }

  reset() {
    Object.values(this.nodes).forEach((n) => {
      n.el?.remove();
    });
    this.nodes = {};
    this.nodeIdCounter = 1;
    this.selectedNodeId = null;
  }

  redrawNodeWithXY(id, x, y) {
    this.nodes[id].x = x;
    this.nodes[id].y = y;

    // https://stackoverflow.com/questions/7108941/css-transform-vs-position
    // Changing transform will trigger a redraw in compositor layer only for the animated element
    // (subsequent elements in DOM will not be redrawn). I want DOM to be redraw to make connection attached to the port.
    // so using position top/left to keep the position intact, not for the animation.
    // I spent hours to find this out with trial and error.
    this.nodes[id].el.style.top = `${y}px`;
    this.nodes[id].el.style.left = `${x}px`;

    // this.updateConnections(id);
    this.emit(NODE_MOVED_EVENT, { id, x, y });
  }

  // handling mouse left click on node
  onNodeClick(e, id) {
    if (this.selectedNodeId && this.nodes[this.selectedNodeId]) {
      this.nodes[this.selectedNodeId].el.classList.remove("selected");
    }
    this.nodes[id].el.classList.add("selected");
    this.selectedNodeId = id;
  }

  removeNode(event, nodeId) {
    console.debug("FLOW: removing node ", nodeId);
    event.stopPropagation();
    const id = parseInt(nodeId);

    this.emit(NODE_REMOVED_EVENT, { id });

    this.nodes[nodeId].el.remove();
    delete this.nodes[nodeId];
  }
}

// eslint-disable-next-line no-unused-vars
class FlowConnection extends EmitterComponent {
  constructor({ outNodeId, outPort, inNodeId, inPort, options = {} }) {
    super({ name: outNodeId + "-" + outPort + "-" + inNodeId + "-" + inPort });
    this.outNodeId = outNodeId;
    this.outPort = outPort;
    this.inNodeId = inNodeId;
    this.inPort = inPort;

    this.dataID = `${this.outNodeId}:${this.outPort}-${this.inNodeId}:${this.inPort}`;

    this.options = options;
    this.zoom = options.zoom || 1;
    this.originalZoom = this.zoom;
    this.connection = null;
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

    this.nodes = this.nodeManager.nodes;
    this.nodeIdCounter = 1;
    this.nodeWidth = options.nodeWidth || 200;
    this.nodeHeight = options.nodeHeight || 90;

    this.connections = [];
    this.pathMap = new Map();

    this.tempPath = null;
    this.badPaths = new Set();
    this.tempSource = null;
  }

  addConnection(outNodeId, outPort, inNodeId, inPort) {
    // if (!this.doMakeConnection(outNodeId, inNodeId)) {
    //     notification.warning("This connection will create cyclic flow.");
    //     this.badTempConnection(outNodeId, outPort, inNodeId, inPort);
    //     this.badConnection = true;
    //     return false;
    // }

    // this.badConnection = false;
    const outId = parseInt(outNodeId);
    const inId = parseInt(inNodeId);
    const oPort = parseInt(outPort);
    const iPort = parseInt(inPort);

    const exists = this.connections.some(
      (c) =>
        c.outNodeId === outId && c.outPort === oPort && c.inNodeId === inId && c.inPort === iPort
    );
    if (exists) return;

    const connection = { outNodeId: outId, outPort: oPort, inNodeId: inId, inPort: iPort };
    this.connections.push(connection);

    this.createConnectionPath(connection);
    this.emit(CONNECTION_CREATED_EVENT, connection);
    return true;
  }

  reset() {
    this.connections = [];
    this.pathMap.forEach((path) => path.remove());
    this.pathMap.clear();
    this.clearTempPath?.();
  }

  getConnectionKey(conn) {
    return `${conn.outNodeId}:${conn.outPort}-${conn.inNodeId}:${conn.inPort}`;
  }

  createConnectionPath(conn) {
    const key = this.getConnectionKey(conn);
    const p1 = this.getPortPosition(conn.outNodeId, "output", conn.outPort);
    const p2 = this.getPortPosition(conn.inNodeId, "input", conn.inPort);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = this.getBazierPath(p1.x, p1.y, p2.x, p2.y);
    path.setAttribute("d", d);
    path.setAttribute("class", "flow-connection-path");
    path.dataset.id = key;

    path.onclick = (e) => {
      e.stopPropagation();
      // this.removePath(path, conn);
      this.emit(CONNECTION_CLICKED_EVENT, conn);
    };

    this.connectionContainer.appendChild(path);
    this.pathMap.set(key, path);
  }

  updateConnections(nodeId) {
    const id = parseInt(nodeId);
    const relevant = this.connections.filter((c) => c.outNodeId === id || c.inNodeId === id);

    relevant.forEach((conn) => {
      const key = this.getConnectionKey(conn);
      const path = this.pathMap.get(key);
      if (!path) return;

      const p1 = this.getPortPosition(conn.outNodeId, "output", conn.outPort);
      const p2 = this.getPortPosition(conn.inNodeId, "input", conn.inPort);
      const d = this.getBazierPath(p1.x, p1.y, p2.x, p2.y);
      path.setAttribute("d", d);

      this.emit(CONNECTION_UPDATED_EVENT, conn);
    });
  }

  removeConnection(conn) {
    const key = this.getConnectionKey(conn);
    const path = this.pathMap.get(key);

    if (path) {
      path.remove();
      this.pathMap.delete(key);
    }

    this.connections = this.connections.filter((c) => c !== conn);
    this.emit(CONNECTION_REMOVED_EVENT, conn);
  }

  removeRelatedConnections(nodeId) {
    const relevant = this.connections.filter(
      (c) => c.outNodeId === nodeId || c.inNodeId === nodeId
    );

    relevant.forEach((conn) => {
      this.removeConnection(conn);
    });
  }

  getPortPosition(nodeId, type, index) {
    const node = this.nodes[nodeId];
    if (!node || !node.el) return { x: 0, y: 0 };

    const portEl = node.el.querySelector(`.flow-port[data-type="${type}"][data-index="${index}"]`);
    if (!portEl) return { x: node.x, y: node.y };

    const portRect = portEl.getBoundingClientRect();
    const nodeRect = node.el.getBoundingClientRect();

    const offsetX = (portRect.left - nodeRect.left + portRect.width / 2) / this.zoom;
    const offsetY = (portRect.top - nodeRect.top + portRect.height / 2) / this.zoom;

    return {
      x: node.x + offsetX,
      y: node.y + offsetY,
    };
  }

  getBazierPath(x1, y1, x2, y2) {
    const curvature = 0.5;
    const hx1 = x1 + Math.abs(x2 - x1) * curvature;
    const hx2 = x2 - Math.abs(x2 - x1) * curvature;

    return `M ${x1} ${y1} C ${hx1} ${y1} ${hx2} ${y2} ${x2} ${y2}`;
  }

  beginTempConnection(fromNodeId, fromPortIndex) {
    this.tempSource = { nodeId: fromNodeId, portIndex: fromPortIndex };
  }

  endTempConnection() {
    this.tempSource = null;
    this.clearTempPath();
  }

  updateTempConnection(mouseX, mouseY) {
    if (!this.tempSource) return;

    const { nodeId, portIndex } = this.tempSource;
    const p1 = this.getPortPosition(nodeId, "output", portIndex);

    this.createTempPath(p1, { x: mouseX, y: mouseY });
  }

  createTempPath(p1, p2) {
    if (!this.tempPath) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "flow-connection-path selected flow-connection-temp");
      path.style.pointerEvents = "none";
      this.connectionContainer.appendChild(path);
      this.tempPath = path;
    } else {
      this.clearBadPaths();
    }

    const d = this.getBazierPath(p1.x, p1.y, p2.x, p2.y);
    this.tempPath.setAttribute("d", d);
  }

  // bad connection path (cyclic in DAG) will be cleared on below scenario
  // 1. drawing new (temp) connection
  // 2. cancel drawing connection this.keyDownCancelConnection
  clearTempPath() {
    if (this.tempPath) {
      this.tempPath.remove();
      this.tempPath = null;
    }
    this.clearBadPaths();
  }

  markPathBad(conn) {
    this.markTempPathBad();
    this.markExistingPathBad(conn);
  }

  markTempPathBad() {
    if (this.tempPath) {
      this.tempPath.classList.add("flow-connection-path-bad");
      this.badPaths.add(this.tempPath);
    }
  }

  markExistingPathBad(conn) {
    const key = this.getConnectionKey(conn);
    const path = this.pathMap.get(key);
    if (path) {
      path.classList.add("flow-connection-path-bad");
      this.badPaths.add(path);
    }
  }

  clearBadPaths() {
    this.badPaths.forEach((path) => {
      path.classList.remove("flow-connection-path-bad");
    });
    this.badPaths.clear();
  }
}

class FlowSerializer {
  export(flow) {
    const nodeManager = flow.nodeManager;
    const connectionManager = flow.connectionManager;
    const canvas = flow.canvas;

    // eslint-disable-next-line no-unused-vars
    const nodes = Object.values(nodeManager.nodes).map(({ el, node, ...rest }) => ({
      id: rest.id,
      name: rest.name,
      inputs: rest.inputs,
      outputs: rest.outputs,
      x: rest.x,
      y: rest.y,
      html: rest.html,
    }));

    const connections = connectionManager.connections.map((c) => ({
      outNodeId: c.outNodeId,
      outPort: c.outPort,
      inNodeId: c.inNodeId,
      inPort: c.inPort,
    }));

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
      options: this.options,
    });

    this.connectionManager = new FlowConnectionManager({
      name: this.name + "-flow-connection-manager",
      connectionContainer: this.svgEl,
      nodeManager: this.nodeManager,
      options: this.options,
    });

    this.canvas.on("canvas:zoom", ({ data }) => {
      this.zoom = data.zoom;
      this.connectionManager.zoom = data.zoom;
      this.nodeManager.zoom = data.zoom;
    });

    this.canvas.on("node:dropped", ({ data }) => {
      console.debug("Node is dropped: ", data);
      this.emit(NODE_DROPPED_EVENT, data);
      this.nodeManager.dropNode(data);
    });

    this.nodeManager.on(NODE_MOVED_EVENT, ({ id, x, y }) => {
      console.debug("Node is moved: ", id, x, y);
      this.emit(NODE_MOVED_EVENT, { id, x, y });
      this.connectionManager.updateConnections(id);
    });

    this.nodeManager.on(NODE_REMOVED_EVENT, ({ id }) => {
      console.debug("Node is removed: ", id);
      this.emit(NODE_REMOVED_EVENT, { id });
      this.removeNode(id);
    });

    this.nodeManager.on("port:connect:start", ({ nodeId, portIndex, event }) => {
      this.mouseDownStartConnection({ dataset: { index: portIndex } }, nodeId, event);
    });

    this.nodeManager.on("port:connect:end", ({ nodeId, portIndex, event }) => {
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

    // TODO: need to fix O(n^2) time complexity
    for (let pos = 0; pos < stack.length - 1; pos++) {
      const conn = this.connectionManager.connections.find(
        (c) => c.outNodeId === stack[pos] && c.inNodeId === stack[pos + 1]
      );
      if (conn) {
        this.connectionManager.markPathBad(conn);
      }
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

      // this.connectionManager.updateTempConnection(x, y);
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

export { DagValidator, Flow };
