import { Flow } from "../src/flow.js";
import { DagValidator } from "../src/components/plugins/dag-validator.js";

import { DraggableBehavior } from "../src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "../src/components/node/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "../src/components/node/behaviors/EditableLabelBehavior.js";
import { BehaviorRegistry } from "../src/components/node/behaviors/BehaviorRegistry.js";
import { ResizableBehavior } from "../src/components/node/behaviors/ResizableBehavior.js";

BehaviorRegistry.register(DraggableBehavior);
BehaviorRegistry.register(SelectableBehavior);
BehaviorRegistry.register(EditableLabelBehavior);
BehaviorRegistry.register(ResizableBehavior);

describe("Flow Integration", () => {
  let container;
  let flow;
  let mockNotification;

  beforeEach(() => {
    mockNotification = {
      warning: jest.fn(),
    };

    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);

    // Mock getBoundingClientRect for layout calculations
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
    }));

    flow = new Flow({
      name: "TestFlow",
      notification: mockNotification,
      validators: [new DagValidator()],
    });
    flow.renderInto(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should initialize with managers and canvas", () => {
    expect(flow.nodeManager).toBeDefined();
    expect(flow.connectionManager).toBeDefined();
    expect(flow.canvas).toBeDefined();
    expect(container.querySelector(".floxy-flow-container")).toBeTruthy();
  });

  test("should orchestrate node addition and connection creation", () => {
    const n1 = flow.addNode({ name: "Source" });
    const n2 = flow.addNode({ name: "Target" });

    const connection = flow.addConnection(n1, 0, n2, 0);

    expect(connection.id).toBe(1);
    expect(flow.connectionManager.connections.size).toBe(1);
    expect(container.querySelector("path")).toBeTruthy();
  });

  test("should enforce DAG validation via DagValidator integration", () => {
    const n1 = flow.addNode({ name: "N1" });
    const n2 = flow.addNode({ name: "N2" });

    flow.addConnection(n1, 0, n2, 0);

    // Cycle: n2 -> n1
    const success = flow.addConnection(n2, 0, n1, 0);

    expect(success).toBe(false);
    expect(mockNotification.warning).toHaveBeenCalled();
  });

  test("should cleanup connections when a node is removed via UI", () => {
    const n1 = flow.addNode({ name: "N1" });
    const n2 = flow.addNode({ name: "N2" });
    flow.addConnection(n1, 0, n2, 0);

    const closeBtn = container.querySelector(`#node-${n1} .node-close`);
    closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(flow.nodeManager.nodes.get(n1)).toBeUndefined();
    expect(flow.connectionManager.connections.size).toBe(0);
  });

  test("should handle nodes dropped on the canvas", () => {
    const dropEvent = new MouseEvent("drop", {
      clientX: 500,
      clientY: 500,
      bubbles: true,
    });

    const nodeData = { name: "Dropped", inputs: 1, outputs: 1 };
    dropEvent.dataTransfer = {
      getData: jest.fn((type) => {
        if (type === "module") return "default";
        if (type === "group") return "mygroup";
        if (type === "name") return "Dropped";
        return "";
      }),
    };

    container.querySelector(".floxy-flow-container").dispatchEvent(dropEvent);

    const nodes = flow.nodeManager.getAllNodes();
    expect(nodes.some((n) => n.name === "Dropped")).toBe(true);
  });

  test("should add connections between nodes when cyclic if flow is non-dag", () => {
    // New instance without DagValidator
    const freeFlow = new Flow({ name: "FreeFlow" });
    freeFlow.renderInto(container);

    const n1 = freeFlow.addNode({ name: "N1" });
    const n2 = freeFlow.addNode({ name: "N2" });

    freeFlow.addConnection(n1, 0, n2, 0);
    const connection = freeFlow.addConnection(n2, 0, n1, 0); // Cycle

    expect(connection.id).toBe(`${n2}:0-${n1}:0`);
    expect(freeFlow.connectionManager.connections.size).toBe(2);
  });

  test("should move node at correct speed when zoomed", async () => {
    const zoom = 0.5;
    const zoomedFlow = new Flow({ name: "ZoomedFlow", options: { zoom } });
    zoomedFlow.renderInto(container);

    const n1 = zoomedFlow.addNode({ name: "N1", x: 100, y: 100, outputs: 1 });
    const n2 = zoomedFlow.addNode({ name: "N2", x: 400, y: 100, inputs: 1 });
    zoomedFlow.addConnection(n1, 0, n2, 0);

    const path = container.querySelector("path.connection");
    const initialD = path.getAttribute("d");

    const nodeEl = container.querySelector(`#node-${n1}`);

    // Simulate Drag: Move mouse 100px. At 0.5 zoom, the node should move 200 logical units.
    nodeEl.dispatchEvent(new MouseEvent("mousedown", { clientX: 0, clientY: 0, bubbles: true }));
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 100, clientY: 100, bubbles: true })
    );

    // Wait for internal RAF/timeouts in DragHandler (we simulate delay)
    await new Promise((resolve) => setTimeout(resolve, 20));

    console.log(zoomedFlow.nodeManager.getNode(n1).x);

    expect(zoomedFlow.nodeManager.getNode(n1).x).toBe(300); // 100 + 100/0.5
    expect(zoomedFlow.nodeManager.getNode(n1).y).toBe(300);

    // Verify connection path also moved (integration check)
    const updatedD = path.getAttribute("d");
    expect(updatedD).not.toBe(initialD);
  });

  test("should cancel connection on ESC and clear bad connection marks", async () => {
    const n1 = flow.addNode({ name: "N1" });
    const n2 = flow.addNode({ name: "N2" });
    const n3 = flow.addNode({ name: "N3" });
    const n4 = flow.addNode({ name: "N4" });
    flow.addConnection(n1, 0, n2, 0);
    flow.addConnection(n2, 0, n3, 0);
    flow.addConnection(n3, 0, n4, 0);

    const outPort = container.querySelector(`#node-${n4} .flow-port[data-type="output"]`);
    const inPort = container.querySelector(`#node-${n2} .flow-port[data-type="input"]`);
    outPort.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(flow.isConnecting).toBe(true);

    // Move mouse
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 168 }));

    // Wait for RAF
    await new Promise((resolve) => setTimeout(resolve, 1));

    expect(flow.connectionManager.tempConnection).not.toBeNull();

    expect(container.querySelector(".flow-connection-temp")).not.toBeNull();

    // Release on input
    inPort.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    let pathId = "2:0-3:0";
    let path = flow.svgEl.querySelector(`path[id="${pathId}"]`);
    expect(path.classList.contains("flow-connection-path-bad")).toBeTruthy();

    let pathId2 = "3:0-4:0";
    let path2 = flow.svgEl.querySelector(`path[id="${pathId2}"]`);
    expect(path2.classList.contains("flow-connection-path-bad")).toBeTruthy();

    let pathId3 = "4:0-2:0";
    let path3 = flow.svgEl.querySelector(`path[id="${pathId3}"]`);
    expect(path3).toBeNull();

    let path4 = flow.svgEl.querySelector(".flow-connection-temp");
    expect(path4.classList.contains("flow-connection-path-bad")).toBeTruthy();

    // Press ESC key to cancel
    window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27, bubbles: true }));

    // Verify connection was cancelled
    expect(flow.isConnecting).toBe(false);
    expect(container.querySelector(".flow-connection-temp")).toBeNull();
    expect(flow.connectionManager.tempConnection).toBeNull();

    pathId = "2:0-3:0";
    path = flow.svgEl.querySelector(`path[id="${pathId}"]`);
    expect(path.classList.contains("flow-connection-path-bad")).not.toBeTruthy();

    pathId2 = "3:0-4:0";
    path2 = flow.svgEl.querySelector(`path[id="${pathId2}"]`);
    expect(path2.classList.contains("flow-connection-path-bad")).not.toBeTruthy();
  });

  test("should cancel connection on ESC keydown while drawing", async () => {
    const n1 = flow.addNode({ name: "Out", x: 0, y: 0, outputs: 1 });
    const outPort = container.querySelector(`#node-${n1} .flow-port[data-type="output"]`);

    // Start drag
    flow.mouseDownStartConnection(outPort, n1, { stopPropagation: jest.fn() });
    expect(flow.isConnecting).toBe(true);

    // Press ESC (using keyCode for parity)
    window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27, bubbles: true }));

    expect(flow.isConnecting).toBe(false);
    expect(flow.connectionManager.tempConnection).toBeNull();
  });

  test("should remove connection when clicking on path", () => {
    const n1 = flow.addNode({ name: "N1", outputs: 1 });
    const n2 = flow.addNode({ name: "N2", inputs: 1 });
    flow.addConnection(n1, 0, n2, 0);

    const path = container.querySelector("path.flow-connection-path");
    expect(path).toBeTruthy();

    // Click on the connection path to remove it
    path.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Verify connection was removed
    expect(flow.connectionManager.size).toBe(0);
    expect(container.querySelector("path.flow-connection-path")).toBeNull();
  });

  test("should finalize connection on mouseup over target port", () => {
    const n1 = flow.addNode({ name: "N1", outputs: 1 });
    const n2 = flow.addNode({ name: "N2", inputs: 1 });

    const outPort = container.querySelector(`#node-${n1} .flow-port[data-type="output"]`);
    const inPort = container.querySelector(`#node-${n2} .flow-port[data-type="input"]`);

    // Start on output
    outPort.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    // End on input
    inPort.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(flow.connectionManager.size).toBe(1);
    const conn = flow.connectionManager.getConnection(`${n1}:0-${n2}:0`);
    expect(conn.outNodeId).toBe(n1);
    expect(conn.inNodeId).toBe(n2);
  });

  test("should manually update connections on external triggers", () => {
    const n1 = flow.addNode({ name: "N1", x: 100, y: 100 });
    const n2 = flow.addNode({ name: "N2", x: 400, y: 100 });
    flow.addConnection(n1, 0, n2, 0);

    const path = container.querySelector("path.connection");
    const initialD = path.getAttribute("d");

    // Change mock values to simulate layout shift
    Element.prototype.getBoundingClientRect = jest.fn(function () {
      if (this.classList.contains("flow-port")) {
        return { top: 210, left: 390, width: 10, height: 10 }; // Shifted
      }
      return { width: 1000, height: 1000, top: 0, left: 0 };
    });

    flow.connectionManager.updateConnections(n1);

    const updatedD = path.getAttribute("d");
    expect(updatedD).not.toBe(initialD);
  });

  test("should export flow state correctly", () => {
    const n1 = flow.addNode({ name: "N1", x: 100, y: 100, outputs: 1 });
    const n2 = flow.addNode({ name: "N2", x: 400, y: 100, inputs: 1 });
    flow.addConnection(n1, 0, n2, 0);
    flow.canvas.zoom = 1.5;

    const data = flow.export();

    expect(data.zoom).toBe(1.5);
    expect(data.nodes.length).toBe(2);
    expect(data.connections.length).toBe(1);
    expect(data.nodes[0].name).toBe("N1");
    expect(data.connections[0]).toEqual({
      outNodeId: n1,
      outPort: 0,
      inNodeId: n2,
      inPort: 0,
    });
  });

  test("should import flow state correctly", () => {
    const importData = {
      zoom: 2,
      canvas: { x: 150, y: 50 },
      nodes: [
        { id: 1, name: "Node A", x: 10, y: 10, inputs: 1, outputs: 1 },
        { id: 2, name: "Node B", x: 300, y: 10, inputs: 1, outputs: 1 },
      ],
      connections: [{ outNodeId: 1, outPort: 0, inNodeId: 2, inPort: 0 }],
    };

    flow.import(importData);

    expect(flow.zoom).toBe(2);
    expect(Object.keys(flow.nodeManager.nodes).length).toBe(2);
    expect(flow.connectionManager.connections.length).toBe(1);

    const nodeA = flow.nodeManager.nodes[1];
    expect(nodeA.name).toBe("Node A");
    expect(container.querySelector("#node-1")).toBeTruthy();
    expect(container.querySelector("path")).toBeTruthy();

    expect(flow.canvas.canvasX).toBe(150);
    expect(flow.canvas.canvasY).toBe(50);
    expect(flow.canvasEl.style.transform).toContain("translate(150px, 50px)");
    expect(flow.container.style.backgroundPosition).toBe("150px 50px");
  });
});
