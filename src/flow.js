import { EmitterComponent } from "@uiframe/core";

import { FlowCanvas } from "./components/canvas.js";
import { FlowNodeManager } from "./components/node.js";
import { FlowConnectionManager } from "./components/connection.js";
import { FlowSerializer } from "./components/serializer.js";

import { defaultCommandRegistry as defaultNodeCommandRegistry } from "./components/node/capability.js";
import { defaultCommandRegistry as defaultConnectionCommandRegistry } from "./components/connection/capability.js";

import { SelectionToolbar } from "./toolbar.js";

import { SetBezierPath, SetLinePath, SetOrthogonalPath } from "./components/commands/paths.js";

import * as constants from "./components/constants.js";

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
    nodeCommandRegistry = defaultNodeCommandRegistry,
    connectionCommandRegistry = defaultConnectionCommandRegistry,
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

    this.defaultPathType = options.connection?.pathType || "bezier";
    this.availablePaths = [SetBezierPath, SetLinePath, SetOrthogonalPath];
  }

  /**
   * Returns component HTML structure.
   */
  html() {
    const pathOptions = this.availablePaths
      .map((cmd) => {
        const path = cmd.capability.slice(5);
        const label = path.charAt(0).toUpperCase() + path.slice(1);
        return `<a href="#" class="list-group-item list-group-item-action tool-item ${path === this.defaultPathType ? "active" : ""}" 
                  id="${this.id}-${path}" data-path="${path}">${cmd.icon} <span class="ms-2">${label}</span></a>`;
      })
      .join("");
    return `<div class="list-group tools list-group-horizontal-sm zoom-actions" style="width: fit-content;">
              <a href="#" class="list-group-item tool-item list-group-item-action zoom-item" id="${this.id}-zoomin" data-action="zoomin"><i class="bi bi-plus-lg"></i></a>                  
              <a href="#" class="list-group-item tool-item list-group-item-action zoom-item" id="${this.id}-zoomreset" data-action="zoomreset"><i class="bi bi-justify"></i></a>
              <a href="#" class="list-group-item tool-item list-group-item-action zoom-item" id="${this.id}-zoomout" data-action="zoomout"><i class="bi bi-dash-lg"></i></a>
            </div>
            <div class="list-group tools path-selection">
              ${pathOptions}
            </div>
            `;
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

    this.pathOptionsEls = this.containerEl.querySelectorAll(
      ".list-group.tools.path-selection .list-group-item"
    );
    this.pathOptionsEls.forEach((el) => {
      el.addEventListener("click", this.onPathOptionAction.bind(this));
    });

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

    this.canvas.on(constants.CANVAS_ZOOM_EVENT, ({ data }) => {
      this.zoom = data.zoom;
      this.connectionManager.zoom = data.zoom;
      this.nodeManager.zoom = data.zoom;
      this.zoomChangeUpdate();
    });

    this.nodeManager.on(constants.NODE_SELECTED_EVENT, ({ id, cx, cy }) => {
      const node = this.nodeManager.getNode(id);
      this.emit(constants.NODE_SELECTED_EVENT, { id, cx, cy });
      this.selectionManager.set(node, this.nodeManager, this.nodeCommandRegistry);
      this.toolbar.updateView();
    });

    // eslint-disable-next-line no-unused-vars
    this.nodeManager.on(constants.NODE_DESELECTED_EVENT, ({ id }) => {
      this.selectionManager.clear();
      this.toolbar.updateView();
    });

    this.connectionManager.on(constants.CONNECTION_SELECTED_EVENT, ({ id, cx, cy }) => {
      console.debug("Connection is selected: ", id);
      this.emit(constants.CONNECTION_SELECTED_EVENT, { id, cx, cy });
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
    this.connectionManager.on(constants.CONNECTION_DESELECTED_EVENT, ({ id }) => {
      this.selectionManager.clear();
      this.toolbar.updateView();
    });

    this.canvas.on(constants.NODE_DROPPED_EVENT, (config) => {
      console.debug("Node is dropped: ", config);
      this.emit(constants.NODE_DROPPED_EVENT, config);
      this.nodeManager.dropNode(config);
    });

    this.nodeManager.on(constants.NODE_MOVED_EVENT, ({ id, x, y }) => {
      this.emit(constants.NODE_MOVED_EVENT, { id, x, y });
      this.connectionManager.updateConnections(id);
      this.toolbar.hide();
    });

    this.nodeManager.on(constants.NODE_UPDATED_EVENT, ({ id, x, y, w, h }) => {
      this.emit(constants.NODE_UPDATED_EVENT, { id, x, y, w, h });
      this.connectionManager.updateConnections(id);
      this.toolbar.hide();
    });

    this.nodeManager.on(constants.NODE_REMOVED_EVENT, ({ id }) => {
      console.debug("Node is removed: ", id);
      this.emit(constants.NODE_REMOVED_EVENT, { id });
      this.removeNode(id);
      this.toolbar.updateView();
    });

    this.nodeManager.on(constants.PORT_CONNECT_START_EVENT, ({ nodeId, portIndex, event }) => {
      if (this.isConnecting) {
        console.debug("Already connection is being drawn. Ignoring this event.");
        return;
      }
      console.debug("Port connect start: ", nodeId, portIndex, event);
      this.mouseDownStartConnection({ dataset: { index: portIndex } }, nodeId, event);
    });

    this.nodeManager.on(constants.PORT_CONNECT_END_EVENT, ({ nodeId, portIndex, event }) => {
      console.debug("Port connect end: ", nodeId, portIndex, event);
      this.mouseUpCompleteConnection({ dataset: { index: portIndex } }, nodeId, event);
    });

    this.connectionManager.on(constants.CONNECTION_CREATED_EVENT, (connection) => {
      console.debug("Connection is created: ", connection);
      this.emit(constants.CONNECTION_CREATED_EVENT, connection);

      this.validators.forEach((v) =>
        v.onConnectionAdded?.({
          outNodeId: connection.outNodeId,
          inNodeId: connection.inNodeId,
        })
      );
    });

    this.connectionManager.on(constants.CONNECTION_REMOVED_EVENT, (connection) => {
      console.debug("Connection is removed: ", connection);
      this.emit(constants.CONNECTION_REMOVED_EVENT, connection);

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

    this.zoomChangeUpdate();
  }

  bindCommandEvents() {
    window.addEventListener("keydown", (e) => {
      const capability = constants.COMMAND_CAPABILITIES[e.key];
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

  onPathOptionAction(e) {
    e.preventDefault();
    const path = e.currentTarget.dataset.path;
    this.defaultPathType = path;
    this.pathOptionsEls.forEach((el) => {
      el.classList.remove("active");
    });
    e.currentTarget.classList.add("active");
  }

  highlightCycle(stack) {
    if (!stack || stack.length < 2) return;

    console.debug("FLOW: highlight cycle", stack);
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
    this.connectionManager.beginTempConnection(nodeId, port.dataset.index, this.defaultPathType);
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

    const created = this.connectionManager.addConnection(
      outNodeId,
      outPort,
      inNodeId,
      inPort,
      this.defaultPathType
    );

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
    this.zoomChangeUpdate();
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

export { Flow };
