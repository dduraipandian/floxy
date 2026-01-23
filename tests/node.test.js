import { FlowNodeManager } from "../src/components/node.js";
import * as constants from "../src/components/constants.js";

import { DraggableBehavior } from "../src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "../src/components/node/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "../src/components/node/behaviors/EditableLabelBehavior.js";
import { BehaviorRegistry } from "../src/components/node/behaviors/BehaviorRegistry.js";
import { ResizableBehavior } from "../src/components/node/behaviors/ResizableBehavior.js";

BehaviorRegistry.register(DraggableBehavior);
BehaviorRegistry.register(SelectableBehavior);
BehaviorRegistry.register(EditableLabelBehavior);
BehaviorRegistry.register(ResizableBehavior);

describe("FlowNodeManager", () => {
  let canvasContainer;
  let manager;

  beforeEach(() => {
    canvasContainer = document.createElement("div");
    canvasContainer.id = "canvas-container";
    document.body.appendChild(canvasContainer);

    manager = new FlowNodeManager({
      name: "test-node-manager",
      canvasContainer: canvasContainer
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should add a node and render it", () => {
    const id = manager.addNode({ name: "Action", x: 10, y: 20, module: "default", group: "mygroup", label: "Action" });
    expect(id).toBe(1);
    expect(manager.nodes.get(id)).toBeDefined();

    const nodeEl = canvasContainer.querySelector(`#node-${id}`);
    expect(nodeEl).toBeTruthy();
    expect(nodeEl.style.left).toBe("10px");
    expect(nodeEl.style.top).toBe("20px");
  });

  test("should drop a node and center it", () => {
    manager.zoom = 1;
    manager.dropNode({ x: 500, y: 500, name: "Dropped", module: "default", group: "mygroup", label: "Action" });
    const node = manager.nodes.get(1);

    // x = (500 - 200/2) / 1 = 400
    // y = (500 - 50/2) / 1 = 475
    expect(node.x).toBe(400);
    expect(node.y).toBe(475);
  });

  test("should handle node selection on click", () => {
    const id = manager.addNode({ name: "Selectable", module: "default", group: "mygroup", label: "Action" });
    const nodeEl = canvasContainer.querySelector(`#node-${id}`);

    nodeEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    console.log(canvasContainer.innerHTML);
    expect(nodeEl.classList.contains("selected")).toBe(true);
    expect(SelectableBehavior.active.node.id).toBe(id);

    const id2 = manager.addNode({ name: "Other", module: "default", group: "mygroup", label: "Action" });
    const nodeEl2 = canvasContainer.querySelector(`#node-${id2}`);
    nodeEl2.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(nodeEl.classList.contains("selected")).toBe(false);
    expect(nodeEl2.classList.contains("selected")).toBe(true);
    expect(SelectableBehavior.active.node.id).toBe(id2);
  });

  test("should remove node and emit event", () => {
    const id = manager.addNode({ name: "Removable" });
    const spy = jest.fn();
    manager.on(constants.NODE_REMOVED_EVENT, spy);

    const closeBtn = canvasContainer.querySelector(`#node-${id} .node-close`);
    closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(manager.nodes[id]).toBeUndefined();
    expect(canvasContainer.querySelector(`#node-${id}`)).toBeFalsy();
    expect(spy).toHaveBeenCalledWith({ id: id });
  });

  test("should emit port:connect:start on port mousedown", () => {
    const spy = jest.fn();
    manager.on(constants.PORT_CONNECT_START_EVENT, spy);
    const id = manager.addNode({ name: "Ports", outputs: 1, module: "default", group: "mygroup", label: "Action" });

    const port = canvasContainer.querySelector(".flow-ports-output .flow-port");
    port.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: id,
        portIndex: "0",
      })
    );
  });

  test("should handle node movement and update styles", () => {
    const id = manager.addNode({ name: "Moving Node", x: 100, y: 100, module: "default", group: "mygroup", label: "Action" });
    const node = manager.getNode(id);
    node.move(200, 300);

    expect(node.x).toBe(200);
    expect(node.y).toBe(300);

    const nodeEl = canvasContainer.querySelector(`#node-${id}`);
    expect(nodeEl.style.left).toBe("200px");
    expect(nodeEl.style.top).toBe("300px");
  });

  test("should calculate port positions correctly with zoom", () => {
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

    manager.zoomGetter = () => 2; // 2x zoom
    const n1 = manager.addNode({ name: "Node", x: 100, y: 100 });

    const pos = manager.getNode(n1).view.getPortPosition({ type: "output", index: 0 });

    // Mock getBoundingClientRect: node {left: 100, top: 100}, port {left: 290, top: 110, width: 10, height: 10}
    // offsetX = (290 - 100 + 10/2) / 2 = (190 + 5) / 2 = 97.5
    // offsetY = (110 - 100 + 10/2) / 2 = (10 + 5) / 2 = 7.5
    // x = 100 + 97.5 = 197.5
    // y = 100 + 7.5 = 107.5
    expect(pos.x).toBe(197.5);
    expect(pos.y).toBe(107.5);
  });
});
