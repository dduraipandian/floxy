import { EmitterComponent } from "@uiframe/core";

import { FlowCanvas } from "./components/canvas.js";
import { FlowNodeManager } from "./components/node.js";
import { FlowConnectionManager } from "./components/connection.js";
import { FlowSerializer } from "./components/serializer.js";

import * as constants from "./components/constants.js";

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

    // this.nodeManager = new FlowNodeManager({
    //   name: this.name + "-flow-node-manager",
    //   canvasContainer: this.canvasEl,
    //   options: this.options,
    // });

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
    });

    this.canvas.on(constants.NODE_DROPPED_EVENT, (config) => {
      console.debug("Node is dropped: ", config);
      this.emit(constants.NODE_DROPPED_EVENT, config);
      this.nodeManager.dropNode(config);
    });

    this.nodeManager.on(constants.NODE_MOVED_EVENT, ({ id, x, y }) => {
      this.emit(constants.NODE_MOVED_EVENT, { id, x, y });
      this.connectionManager.updateConnections(id);
    });

    this.nodeManager.on(constants.NODE_UPDATED_EVENT, ({ id, x, y, w, h }) => {
      this.emit(constants.NODE_UPDATED_EVENT, { id, x, y, w, h });
      this.connectionManager.updateConnections(id);
    });

    this.nodeManager.on(constants.NODE_REMOVED_EVENT, ({ id }) => {
      console.debug("Node is removed: ", id);
      this.emit(constants.NODE_REMOVED_EVENT, { id });
      this.removeNode(id);
    });

    this.nodeManager.on(constants.PORT_CONNECT_START_EVENT, ({ nodeId, portIndex, event }) => {
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

    this.connectionManager.on(constants.CONNECTION_CLICKED_EVENT, (connection) => {
      console.debug("Connection is clicked: ", connection);
      this.emit(constants.CONNECTION_CLICKED_EVENT, connection);
      this.connectionManager.removeConnection(connection);
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
  }

  highlightCycle(stack) {
    if (!stack || stack.length < 2) return;

    console.log("FLOW: highlight cycle", stack);
    // TODO: need to fix O(n^2) time complexity
    for (let pos = 0; pos < stack.length - 1; pos++) {
      const conn = this.connectionManager.getAllConnections().find(c => c.outNodeId === stack[pos] && c.inNodeId === stack[pos + 1]);
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

export { Flow };
