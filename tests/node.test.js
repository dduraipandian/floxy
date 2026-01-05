import FlowNodeManager from "../src/components/node.js";
import * as Constant from "../src/components/constants.js";

describe("FlowNodeManager", () => {
  let canvasContainer;
  let manager;

  beforeEach(() => {
    canvasContainer = document.createElement("div");
    canvasContainer.id = "canvas-container";
    document.body.appendChild(canvasContainer);

    manager = new FlowNodeManager({
      name: "test-node-manager",
      canvasContainer: canvasContainer,
      options: { nodeWidth: 200, nodeHeight: 90 },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should add a node and render it", () => {
    const id = manager.addNode({ name: "Node 1", x: 10, y: 20 });
    expect(id).toBe(1);
    expect(manager.nodes[id]).toBeDefined();

    const nodeEl = canvasContainer.querySelector(`#node-${id}`);
    expect(nodeEl).toBeTruthy();
    expect(nodeEl.style.left).toBe("10px");
    expect(nodeEl.style.top).toBe("20px");
  });

  test("should drop a node and center it", () => {
    manager.zoom = 1;
    manager.dropNode({ x: 500, y: 500, name: "Dropped" });
    const node = Object.values(manager.nodes)[0];

    // x = (500 - 200/2) / 1 = 400
    // y = (500 - 90/2) / 1 = 455
    expect(node.x).toBe(400);
    expect(node.y).toBe(455);
  });

  test("should handle node selection on click", () => {
    const id = manager.addNode({ name: "Selectable" });
    const nodeEl = canvasContainer.querySelector(`#node-${id}`);

    nodeEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(nodeEl.classList.contains("selected")).toBe(true);
    expect(manager.selectedNodeId).toBe(id);

    const id2 = manager.addNode({ name: "Other" });
    const nodeEl2 = canvasContainer.querySelector(`#node-${id2}`);
    nodeEl2.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(nodeEl.classList.contains("selected")).toBe(false);
    expect(nodeEl2.classList.contains("selected")).toBe(true);
    expect(manager.selectedNodeId).toBe(id2);
  });

  test("should remove node and emit event", () => {
    const id = manager.addNode({ name: "Removable" });
    const spy = jest.fn();
    manager.on(Constant.NODE_REMOVED_EVENT, spy);

    const closeBtn = canvasContainer.querySelector(`#node-${id} .node-close`);
    closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(manager.nodes[id]).toBeUndefined();
    expect(canvasContainer.querySelector(`#node-${id}`)).toBeFalsy();
    expect(spy).toHaveBeenCalledWith({ id: id });
  });

  test("should emit port:connect:start on port mousedown", () => {
    const spy = jest.fn();
    manager.on("port:connect:start", spy);
    const id = manager.addNode({ name: "Ports", outputs: 1 });

    const port = canvasContainer.querySelector(".flow-ports-out .flow-port");
    port.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: id,
        portIndex: "0",
      })
    );
  });

  test("should handle node movement and update styles", () => {
    const id = manager.addNode({ name: "Moving Node", x: 100, y: 100 });
    manager.redrawNodeWithXY(id, 200, 300);

    expect(manager.nodes[id].x).toBe(200);
    expect(manager.nodes[id].y).toBe(300);

    const nodeEl = canvasContainer.querySelector(`#node-${id}`);
    expect(nodeEl.style.left).toBe("200px");
    expect(nodeEl.style.top).toBe("300px");
  });
});
