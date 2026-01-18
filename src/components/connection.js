import { EmitterComponent } from "@uiframe/core";
import { ConnectionModel } from "./connection/ConnectionModel.js";
import { ConnectionView } from "./connection/ConnectionView.js";
import { Connection } from "./connection/Connection.js";

import * as constants from "./constants.js";


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

    this.pathMap = new Map();

    this.tempPath = null;
    this.badPaths = new Set();
    this.badConnections = new Set();
    this.tempSource = null;

    // new changes
    this.connectionIdCounter = 1;
    this.connections = new Map();
    this.tempConnection = null;
  }

  addConnection(outNodeId, outPort, inNodeId, inPort) {
    const id = this.connectionIdCounter++;

    const model = new ConnectionModel({ id, outNodeId, outPort, inNodeId, inPort });
    const view = new ConnectionView({ model, nodeManager: this.nodeManager, options: this.options });

    const connection = new Connection({ model, view, nodeManager: this.nodeManager });
    connection.renderInto(this.connectionContainer.id);
    this.connections.set(id, connection);

    view.on(constants.CONNECTION_CLICKED_EVENT, (id) => {
      this.removeConnection(connection);
    });

    return connection;
  }

  reset() {
    this.connections.forEach((conn) => conn.destroy());
    this.connections.clear();
    this.clearTempPath?.();
  }

  getConnectionKey(conn) {
    return `${conn.outNodeId}:${conn.outPort}-${conn.inNodeId}:${conn.inPort}`;
  }

  updateConnections(nodeId) {
    const id = parseInt(nodeId);
    this.connections.forEach((conn, id) => {
      if (conn.source.nodeId === nodeId || conn.target.nodeId === nodeId) {
        conn.update();
        this.emit(constants.CONNECTION_UPDATED_EVENT, conn);
      }
    });
  }

  removeConnection(conn) {
    this.emit(constants.CONNECTION_REMOVED_EVENT, conn);
    this.connections.delete(conn.id);
    conn.destroy();
  }

  removeRelatedConnections(nodeId) {
    this.connections.forEach((conn, id) => {
      if (conn.source.nodeId === nodeId || conn.target.nodeId === nodeId) {
        this.removeConnection(conn);
      }
    });
  }

  beginTempConnection(outNodeId, outPort) {
    const id = "temp";

    const model = new ConnectionModel({
      id,
      outNodeId,
      outPort,
      inNodeId: null,
      inPort: null,
    });

    const view = new ConnectionView({ model, options: { isTemp: true } });

    const connection = new Connection({ model, view, nodeManager: this.nodeManager });
    connection.renderInto(this.connectionContainer.id);

    this.tempConnection = connection;
  }

  updateTempConnection(mouseX, mouseY) {
    if (!this.tempConnection) return;

    this.clearBadPaths();
    this.tempConnection.updateWithXY(mouseX, mouseY);
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

  markPathBad(conn) {
    this.markTempPathBad();
    this.markPathBad(conn);
  }

  markTempPathBad() {
    if (!this.tempConnection) return

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
    return this.connections.values();
  }
}

export { FlowConnectionManager };
