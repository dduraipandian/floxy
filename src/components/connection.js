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

    this.connectionIdCounter = 1;
    this.connections = new Map();
    this.tempConnection = null;
    this.badConnections = new Set();
  }

  addConnection(outNodeId, outPort, inNodeId, inPort, pathType = undefined) {
    const id = this.connectionIdCounter++;
    const connection = this.#createConnection({ id, outNodeId, outPort, inNodeId, inPort, pathType, isTemp: false });
    this.connections.set(id, connection);
    return connection;
  }

  beginTempConnection(outNodeId, outPort, pathType = undefined) {
    const connection = this.#createConnection({ id: "temp", outNodeId, outPort, inNodeId: null, inPort: null, pathType, isTemp: true });
    this.tempConnection = connection;
    return connection;
  }

  #createConnection({ id, outNodeId, outPort, inNodeId, inPort, pathType = undefined, isTemp = false }) {
    const _pathType = pathType ?? this.options?.connection?.pathType ?? "orthogonal";

    const model = new ConnectionModel({ id, outNodeId, outPort, inNodeId, inPort, options: { ...this.options?.connection, pathType: _pathType } });
    const view = new ConnectionView({ model, options: { ...this.options?.connection, isTemp: isTemp } });
    const connection = new Connection({ model, view, nodeManager: this.nodeManager, options: this.options?.connection });
    connection.renderInto(this.connectionContainer.id);

    view.on(constants.CONNECTION_CLICKED_EVENT, id => {
      this.removeConnection(connection);
    });
    return connection;
  }

  reset() {
    this.connections.forEach((conn) => conn.destroy());
    this.connections.clear();
    this.clearTempPath?.();
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

  updateTempConnection(mouseX, mouseY) {
    if (!this.tempConnection) return;

    this.clearBadPaths();
    this.tempConnection.updateWithXY(mouseX, mouseY);
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
    return [...this.connections.values()];
  }
}

export { FlowConnectionManager };
