import FlowConnectionManager from "../src/components/connection.js";
import FlowNodeManager from "../src/components/node.js";
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

    // Mock getBoundingClientRect for port mapping
    // This is used by getPortPosition to find offsets within nodes
    Element.prototype.getBoundingClientRect = jest.fn(function () {
      if (this.classList.contains("flow-node")) {
        return { top: 100, left: 100, width: 200, height: 90 };
      }
      if (this.classList.contains("flow-port")) {
        return { top: 110, left: 290, width: 10, height: 10 }; // Example port position
      }
      return { top: 0, left: 0, width: 0, height: 0 };
    });

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

    expect(manager.connections.length).toBe(1);
    const path = connectionContainer.querySelector("path");
    expect(path).toBeTruthy();
    expect(path.dataset.id).toBe(`${n1}:0-${n2}:0`);
  });

  test("should prevent duplicate connections", () => {
    const n1 = nodeManager.addNode({ name: "Source" });
    const n2 = nodeManager.addNode({ name: "Target" });

    manager.addConnection(n1, 0, n2, 0);
    manager.addConnection(n1, 0, n2, 0);

    expect(manager.connections.length).toBe(1);
  });

  test("should remove a connection and emit event", () => {
    const n1 = nodeManager.addNode({ name: "Source" });
    const n2 = nodeManager.addNode({ name: "Target" });
    manager.addConnection(n1, 0, n2, 0);
    const conn = manager.connections[0];

    const spy = jest.fn();
    manager.on(Constant.CONNECTION_REMOVED_EVENT, spy);

    manager.removeConnection(conn);

    expect(manager.connections.length).toBe(0);
    expect(connectionContainer.querySelector("path")).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(conn);
  });

  test("should correctly calculate Bazier path string", () => {
    const pathStr = manager.getBazierPath(0, 0, 100, 100);
    // M 0 0 C 50 0 50 100 100 100 (assuming 0.5 curvature)
    expect(pathStr).toContain("M 0 0");
    expect(pathStr).toContain("C 50 0 50 100 100 100");
  });

  test("should manage temporary connection drawing", () => {
    manager.beginTempConnection(1, 0);
    expect(manager.tempSource).toEqual({ nodeId: 1, portIndex: 0 });

    manager.updateTempConnection(200, 300);
    const tempPath = connectionContainer.querySelector(".flow-connection-temp");
    expect(tempPath).toBeTruthy();
    expect(tempPath.getAttribute("d")).toBeTruthy();

    manager.endTempConnection();
    expect(manager.tempSource).toBeNull();
    expect(connectionContainer.querySelector(".flow-connection-temp")).toBeFalsy();
  });

  test("should calculate port positions correctly with zoom", () => {
    manager.zoom = 2; // 2x zoom
    const n1 = nodeManager.addNode({ name: "Node", x: 100, y: 100 });

    const pos = manager.getPortPosition(n1, "output", 0);

    // Mock getBoundingClientRect: node {left: 100, top: 100}, port {left: 290, top: 110, width: 10, height: 10}
    // offsetX = (290 - 100 + 10/2) / 2 = (190 + 5) / 2 = 97.5
    // offsetY = (110 - 100 + 10/2) / 2 = (10 + 5) / 2 = 7.5
    // x = 100 + 97.5 = 197.5
    // y = 100 + 7.5 = 107.5
    expect(pos.x).toBe(197.5);
    expect(pos.y).toBe(107.5);
  });

  test("should emit connection:clicked on path click", () => {
    const n1 = nodeManager.addNode({ name: "N1" });
    const n2 = nodeManager.addNode({ name: "N2" });
    manager.addConnection(n1, 0, n2, 0);

    const spy = jest.fn();
    manager.on(Constant.CONNECTION_CLICKED_EVENT, spy);

    const path = connectionContainer.querySelector("path");
    path.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        outNodeId: n1,
        inNodeId: n2,
      })
    );
  });
});
