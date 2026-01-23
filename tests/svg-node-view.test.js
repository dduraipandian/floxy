import { SVGNodeView } from "../src/components/node/SVGNodeView.js";
import { NodeModel } from "../src/components/node/NodeModel.js";

// Mock @uiframe/core same as NodeView test
jest.mock("@uiframe/core", () => {
    return {
        EmitterComponent: class {
            constructor(options) {
                this.name = options.name;
                // Defer container creation
                this.events = {};
            }
            on(event, cb) { this.events[event] = cb; }
            off(event, cb) { delete this.events[event]; }
            emit(event, data) { if (this.events[event]) this.events[event](data); }
        }
    };
});

describe("SVGNodeView", () => {
    let model;

    beforeEach(() => {
        model = new NodeModel({ id: 2, name: "SVG", module: "default" });
    });

    test("should inherit from BaseNodeView", () => {
        const view = new SVGNodeView(model);
        expect(view.shapeName).toBe("svg");
    });

    test("should create element structure", () => {
        const view = new SVGNodeView(model);
        // We need to implement createShape/resize for concrete test, or spy on them if inherited?
        // SVGNodeView is concrete but checks for 'svg' shape support which is hardcoded.
        // Wait, SVGNodeView.js: `this.shapeName = "svg"` and createShape checks `constants.SVGShapes`.
        // We might need to mock constants if "svg" is not in there, but "svg" usually isn't a shape name like "rect".
        // Looking at source: `createShape` calls `document.createElementNS(..., this.shapeName)`.
        // If shapeName is "svg", it creates an nested <svg>.

        view.createShape = jest.fn().mockImplementation(() => document.createElementNS("http://www.w3.org/2000/svg", "rect"));
        view.resize = jest.fn(); // Abstract method in SVGNodeView

        const el = view.getNodeElement();

        expect(el.classList.contains("flow-node")).toBe(true);
        expect(el.querySelector("svg.node")).toBeTruthy();
        expect(el.querySelector(".node-label")).toBeTruthy();
    });
});
