import { BaseNodeView } from "../src/components/node/NodeView.js";
import { NodeModel } from "../src/components/node/NodeModel.js";

/* eslint-disable no-unused-vars */
// Mocking EmitterComponent content without accessing document in factory
jest.mock("@uiframe/core", () => {
  return {
    EmitterComponent: class {
      constructor(options) {
        this.name = options.name;
        this.events = {};
      }
      on(event, cb) {
        this.events[event] = cb;
      }
      off(event, cb) {
        delete this.events[event];
      }
      emit(event, data) {
        if (this.events[event]) this.events[event](data);
      }
    },
  };
});

// Mock concrete implementation of BaseNodeView for testing abstract class
class ConcreteNodeView extends BaseNodeView {
  getNodeElement() {
    return "<div>Node Content</div>";
  }
}

describe("BaseNodeView", () => {
  let model;
  let options;
  let nodeView;

  beforeEach(() => {
    model = new NodeModel({ id: 1, x: 100, y: 100, w: 200, h: 50 });
    options = { zoom: 1 };
    nodeView = new ConcreteNodeView(model, options);
    // Manually add container since our mock couldn't created it
    nodeView.container = document.createElement("div");
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("should throw if model is invalid", () => {
    expect(() => new ConcreteNodeView({})).toThrow("Model must be an instance of NodeModel");
  });

  test("should initialize correctly", () => {
    nodeView.init();
    expect(nodeView.container.dataset.id).toBe("node-1");
    expect(nodeView.container.querySelector(".flow-ports-input")).toBeTruthy();
    expect(nodeView.container.querySelector(".flow-ports-output")).toBeTruthy();
    expect(nodeView.container.querySelector(".node-close")).toBeTruthy();
  });

  test("should calculate port position correctly", () => {
    nodeView.init();
    document.body.appendChild(nodeView.container);

    // Mock getBoundingClientRect
    nodeView.container.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      width: 200,
      height: 50,
    }));

    // Mock port retrieval and its rect
    const mockPort = {
      getBoundingClientRect: jest.fn(() => ({
        left: 290,
        top: 120,
        width: 10,
        height: 10,
      })),
    };

    // We need to overwrite querySelector on the ELEMENT, not the view (view.querySelector wraps el.querySelector)
    // But in init(), this.el = this.container.
    const originalQS = nodeView.container.querySelector.bind(nodeView.container);
    nodeView.container.querySelector = jest.fn((sel) => {
      if (sel.includes(".flow-port")) return mockPort;
      return originalQS(sel);
    });

    const pos = nodeView.getPortPosition({ type: "output", index: 0 });
    expect(pos.x).toBe(295);
    expect(pos.y).toBe(125);
  });

  test("should update container attributes", () => {
    nodeView.updateContainerAttributes();
    const style = nodeView.container.style;
    expect(style.top).toBe("100px");
    expect(style.left).toBe("100px");
    expect(style.width).toBe("200px");
    expect(style.height).toBe("50px");
  });
});
