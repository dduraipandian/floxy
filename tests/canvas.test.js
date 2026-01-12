import { FlowCanvas } from "../src/components/canvas.js";

describe("FlowCanvas", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "app-container";
    document.body.appendChild(container);

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 1000,
      height: 1000,
      top: 0,
      left: 0,
    }));
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should initialize with default zoom and positions", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    canvas.renderInto(container);

    expect(canvas.zoom).toBe(1);
    expect(canvas.canvasX).toBe(0);
    expect(canvas.canvasY).toBe(0);

    const canvasEl = container.querySelector(".flow-canvas");
    expect(canvasEl.style.transform).toContain("scale(1)");
    expect(canvasEl.style.transform).toContain("translate(0px, 0px)");
  });

  test("should update transform when redrawing with new XY", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    canvas.renderInto(container);

    canvas.redrawCanvasWithXY(100, 200);
    const canvasEl = container.querySelector(".flow-canvas");
    expect(canvasEl.style.transform).toContain("translate(100px, 200px)");
    expect(container.style.backgroundPosition).toBe("100px 200px");
  });

  test("should emit canvas:zoom event on wheel", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    const spy = jest.fn();
    canvas.on("canvas:zoom", spy);
    canvas.renderInto(container);

    const event = new WheelEvent("wheel", { deltaY: 100 });
    container.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
    expect(canvas.zoom).toBeCloseTo(0.9); // Default step is 0.1
  });

  test("should emit node:dropped event on drop", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    const spy = jest.fn();
    canvas.on("node:dropped", spy);
    canvas.renderInto(container);

    const dropEvent = new MouseEvent("drop", {
      clientX: 500,
      clientY: 500,
      bubbles: true,
    });

    const nodeData = { name: "Test Node", inputs: 1, outputs: 1 };
    dropEvent.dataTransfer = {
      getData: jest.fn((type) => (type === "application/json" ? JSON.stringify(nodeData) : "")),
    };

    container.dispatchEvent(dropEvent);

    expect(spy).toHaveBeenCalled();
    const emittedData = spy.mock.calls[0][0].data;
    expect(emittedData.name).toBe("Test Node");
    expect(emittedData.x).toBe(500); // clientX (500) - rect.left (0) - canvasX (0)
    expect(emittedData.y).toBe(500);
  });

  test("should support canvas panning via redraw", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    canvas.renderInto(container);

    canvas.redrawCanvasWithXY(150, 250);
    expect(canvas.canvasX).toBe(150);
    expect(canvas.canvasY).toBe(250);

    const canvasEl = container.querySelector(".flow-canvas");
    expect(canvasEl.style.transform).toContain("translate(150px, 250px)");
    expect(container.style.backgroundPosition).toBe("150px 250px");
  });
});
