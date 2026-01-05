import Flow from "../src/flow.js";
import DagValidator from "../src/components/plugins/dag-validator.js";

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

    const success = flow.addConnection(n1, 0, n2, 0);

    expect(success).toBe(true);
    expect(flow.connectionManager.connections.length).toBe(1);
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

    expect(flow.nodeManager.nodes[n1]).toBeUndefined();
    expect(flow.connectionManager.connections.length).toBe(0);
  });

  test("should handle nodes dropped on the canvas", () => {
    const dropEvent = new MouseEvent("drop", {
      clientX: 500,
      clientY: 500,
      bubbles: true,
    });

    const nodeData = { name: "Dropped", inputs: 1, outputs: 1 };
    dropEvent.dataTransfer = {
      getData: jest.fn((type) => (type === "application/json" ? JSON.stringify(nodeData) : "")),
    };

    container.querySelector(".floxy-flow-container").dispatchEvent(dropEvent);

    const nodes = Object.values(flow.nodeManager.nodes);
    expect(nodes.some((n) => n.name === "Dropped")).toBe(true);
  });

  test("should add connections between nodes when cyclic if flow is non-dag", () => {
    // New instance without DagValidator
    const freeFlow = new Flow({ name: "FreeFlow" });
    freeFlow.renderInto(container);

    const n1 = freeFlow.addNode({ name: "N1" });
    const n2 = freeFlow.addNode({ name: "N2" });

    freeFlow.addConnection(n1, 0, n2, 0);
    const success = freeFlow.addConnection(n2, 0, n1, 0); // Cycle

    expect(success).toBe(true);
    expect(freeFlow.connectionManager.connections.length).toBe(2);
  });

  test("should move node at correct speed when zoomed", async () => {
    const zoom = 0.5;
    const zoomedFlow = new Flow({ name: "ZoomedFlow", options: { zoom } });
    zoomedFlow.renderInto(container);

    const n1 = zoomedFlow.addNode({ name: "N1", x: 100, y: 100, outputs: 1 });
    const n2 = zoomedFlow.addNode({ name: "N2", x: 400, y: 100, inputs: 1 });
    zoomedFlow.addConnection(n1, 0, n2, 0);

    const path = container.querySelector("path");
    const initialD = path.getAttribute("d");

    const nodeEl = container.querySelector(`#node-${n1}`);

    // Simulate Drag: Move mouse 100px. At 0.5 zoom, the node should move 200 logical units.
    nodeEl.dispatchEvent(new MouseEvent("mousedown", { clientX: 0, clientY: 0, bubbles: true }));
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 100, clientY: 100, bubbles: true })
    );

    // Wait for internal RAF/timeouts in DragHandler (we simulate delay)
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(zoomedFlow.nodeManager.nodes[n1].x).toBe(300); // 100 + 100/0.5
    expect(zoomedFlow.nodeManager.nodes[n1].y).toBe(300);

    // Verify connection path also moved (integration check)
    const updatedD = path.getAttribute("d");
    expect(updatedD).not.toBe(initialD);
  });

  test("should cancel connection on ESC and clear bad connection marks", async () => {
    const n1 = flow.addNode({ name: "N1" });
    const n2 = flow.addNode({ name: "N2" });
    flow.addConnection(n1, 0, n2, 0);

    const outPort = container.querySelector(`#node-${n2} .flow-port[data-type="output"]`);
    flow.mouseDownStartConnection(outPort, n2, { stopPropagation: jest.fn() });

    // Simulate "bad" state manually for testing the clear logic
    flow.connectionManager.markPathBad(flow.connectionManager.connections[0]);
    expect(container.querySelector(".flow-connection-path-bad")).toBeTruthy();

    // ESC to cancel (using keyCode for parity)
    window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27, bubbles: true }));

    expect(flow.connectionManager.tempSource).toBeNull();
    expect(container.querySelector(".flow-connection-path-bad")).toBeFalsy();
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
    expect(flow.connectionManager.tempSource).toBeNull();
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
    expect(flow.connectionManager.connections.length).toBe(0);
    expect(container.querySelector("path.flow-connection-path")).toBeNull();
  });

  test("should finalize connection on mouseup over target port", () => {
    const n1 = flow.addNode({ name: "N1", outputs: 1 });
    const n2 = flow.addNode({ name: "N2", inputs: 1 });

    const outPort = container.querySelector(`#node-${n1} .flow-port[data-type="output"]`);
    const inPort = container.querySelector(`#node-${n2} .flow-port[data-type="input"]`);

    // Start on output
    flow.mouseDownStartConnection(outPort, n1, { stopPropagation: jest.fn() });

    // End on input
    inPort.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(flow.connectionManager.connections.length).toBe(1);
    expect(flow.connectionManager.connections[0].outNodeId).toBe(n1);
    expect(flow.connectionManager.connections[0].inNodeId).toBe(n2);
  });

  test("should manually update connections on external triggers", () => {
    const n1 = flow.addNode({ name: "N1", x: 100, y: 100 });
    const n2 = flow.addNode({ name: "N2", x: 400, y: 100 });
    flow.addConnection(n1, 0, n2, 0);

    const path = container.querySelector("path");
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
});
