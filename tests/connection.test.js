import { FlowConnectionManager } from "../src/components/connection.js";
import { FlowNodeManager } from "../src/components/node.js";
import * as Constant from "../src/components/constants.js";

describe("FlowConnectionManager", () => {
  let connectionContainer;
  let canvasContainer;
  let nodeManager;
  let manager;

  beforeEach(() => {
    canvasContainer = document.createElement("div");
    canvasContainer.id = "canvas-container";
    document.body.appendChild(canvasContainer);

    connectionContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    connectionContainer.id = "svg-container";
    canvasContainer.appendChild(connectionContainer);

    nodeManager = new FlowNodeManager({
      name: "test-node-manager",
      canvasContainer: canvasContainer,
    });

    manager = new FlowConnectionManager({
      name: "test-conn-manager",
      connectionContainer: connectionContainer,
      nodeManager: nodeManager,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should add a connection and create an SVG path", () => {
    const n1 = nodeManager.addNode({ name: "Source", x: 100, y: 100 });
    const n2 = nodeManager.addNode({ name: "Target", x: 400, y: 100 });

    manager.addConnection(n1, 0, n2, 0);

    expect(manager.connections.size).toBe(1);
    const path = connectionContainer.querySelector("path.connection");
    expect(path).toBeTruthy();
    expect(path.id).toBe(`${n1}:0-${n2}:0`);

    const shadowPath = connectionContainer.querySelector("path.shadow-path");
    expect(shadowPath).toBeTruthy();
    expect(shadowPath.id).toBe(`shadow-${n1}:0-${n2}:0`);
  });

  test("should prevent duplicate connections", () => {
    const n1 = nodeManager.addNode({ name: "Source" });
    const n2 = nodeManager.addNode({ name: "Target" });

    manager.addConnection(n1, 0, n2, 0);
    manager.addConnection(n1, 0, n2, 0);

    expect(manager.size).toBe(1);
  });

  test("should remove a connection and emit event", () => {
    const n1 = nodeManager.addNode({ name: "Source" });
    const n2 = nodeManager.addNode({ name: "Target" });
    manager.addConnection(n1, 0, n2, 0);
    const conn = manager.getConnection(`${n1}:0-${n2}:0`);

    const spy = jest.fn();
    manager.on(Constant.CONNECTION_REMOVED_EVENT, spy);

    manager.removeConnection(conn.id);

    expect(manager.size).toBe(0);
    expect(connectionContainer.querySelector("path.connection")).toBeFalsy();
    expect(connectionContainer.querySelector("path.shadow-path")).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(conn.id);
  });

  test("should manage temporary connection drawing", () => {
    const n1id = nodeManager.addNode({ name: "Source" });

    let connection = manager.beginTempConnection(n1id, 0);
    expect(connection.outNodeId).toEqual(n1id);
    expect(connection.outPort).toEqual(0);

    connection = manager.updateTempConnection(200, 300);
    const tempPath = connectionContainer.querySelector(".flow-connection-temp");
    expect(tempPath).toBeTruthy();
    expect(tempPath.getAttribute("d")).toBeTruthy();

    connection = manager.endTempConnection();
    expect(manager.tempConnection).toBeNull();
    expect(connectionContainer.querySelector(".flow-connection-temp")).toBeFalsy();
  });

  test("should emit connection:removed on real path click", () => {
    const n1 = nodeManager.addNode({ name: "N1" });
    const n2 = nodeManager.addNode({ name: "N2" });
    const connection = manager.addConnection(n1, 0, n2, 0);

    const spy = jest.fn();
    manager.on(Constant.CONNECTION_REMOVED_EVENT, spy);

    const path = connectionContainer.querySelector("path.connection");
    path.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith(connection.id);
  });

  test("should emit connection:removed on shadow path click", () => {
    const n1 = nodeManager.addNode({ name: "N1" });
    const n2 = nodeManager.addNode({ name: "N2" });
    const connection = manager.addConnection(n1, 0, n2, 0);

    const spy = jest.fn();
    manager.on(Constant.CONNECTION_REMOVED_EVENT, spy);

    const path = connectionContainer.querySelector("path.shadow-path");
    path.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith(connection.id);
  });

  test("should set default path type", () => {
    const n1 = nodeManager.addNode({ name: "N1" });
    const n2 = nodeManager.addNode({ name: "N2" });
    const connection = manager.addConnection(n1, 0, n2, 0);

    expect(connection.model.pathType).toBe(Constant.DEFAULT_CONNECTION_PATH_TYPE);
  });

  test("should set path type", () => {
    const options = {
      connection: {
        path_type: "line",
      },
    };
    manager.options = options;
    const n1 = nodeManager.addNode({ name: "N1" });
    const n2 = nodeManager.addNode({ name: "N2" });
    const connection = manager.addConnection(n1, 0, n2, 0);

    expect(connection.model.pathType).toBe("line");
  });
});
