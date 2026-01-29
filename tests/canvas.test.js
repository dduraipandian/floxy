import { FlowCanvas } from "../src/components/canvas.js";
import * as Constant from "../src/components/constants.js";

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

  test("should emit canvas:zoom event on wheel", async () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    const spy = jest.fn();
    canvas.on(Constant.CANVAS_ZOOM_EVENT, spy);
    canvas.renderInto(container);

    const event = new WheelEvent("wheel", { deltaY: 100 });
    container.dispatchEvent(event);

    // Wait for internal RAF/timeouts (we simulate delay)
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Math.min(this.zoom + delta, this.maxZoom) = Math.min(1 - .1, 3) = .9
    //  this.zoom + diff * this.zoomEase = 1 + (-.1 * .15) = .985
    expect(spy).toHaveBeenCalled();
    expect(canvas.zoom).toBeCloseTo(0.985); // with zoom ease .15
  });

  test("should emit node:dropped event on drop", () => {
    const canvas = new FlowCanvas({ name: "test-canvas" });
    const spy = jest.fn();
    canvas.on(Constant.NODE_DROPPED_EVENT, spy);
    canvas.renderInto(container);

    const dropEvent = new MouseEvent("drop", {
      clientX: 500,
      clientY: 500,
      bubbles: true,
    });

    const nodeData = { some: "data" };
    dropEvent.dataTransfer = {
      getData: jest.fn((type) => {
        if (type === "module") return "default";
        if (type === "group") return "mygroup";
        if (type === "name") return "Test Node";
        if (type === "data") return JSON.stringify(nodeData);
        return "";
      }),
    };

    container.querySelector(".flow-canvas").dispatchEvent(dropEvent);

    expect(spy).toHaveBeenCalled();
    const emittedData = spy.mock.calls[0][0];
    expect(emittedData.name).toBe("Test Node");
    expect(emittedData.module).toBe("default");
    expect(emittedData.group).toBe("mygroup");
    expect(emittedData.x).toBe(500); // clientX (500) - rect.left (0) - canvasX (0)
    expect(emittedData.y).toBe(500);
    expect(emittedData.data).toEqual(nodeData);
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
