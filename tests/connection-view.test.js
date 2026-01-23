import { ConnectionView } from "../src/components/connection/ConnectionView.js";

// Mock dependencies
jest.mock("@uiframe/core", () => ({
    EmitterComponent: class {
        constructor(options) {
            this.name = options.name;
            this.parentContainer = { appendChild: jest.fn() }; // Mock parent
        }
        on(event, cb) { this.events = this.events || {}; this.events[event] = cb; }
        emit(event, data) { if (this.events && this.events[event]) this.events[event](data); }
    }
}));

// Mock pathRegistry to avoid importing real paths
jest.mock("../src/components/connection/paths/PathRegistry.js", () => ({
    pathRegistry: {
        get: jest.fn().mockReturnValue(() => "M 0 0 L 10 10")
    }
}));

describe("ConnectionView", () => {
    let model;
    let nodeManager;
    let view;

    beforeEach(() => {
        model = {
            id: "1:0-2:0",
            source: { portIndex: 0 },
            target: { portIndex: 0 },
            style: {
                applyTo: jest.fn(),
                markHover: jest.fn(),
                markTemp: jest.fn(),
                path: "orthogonal"
            },
            arrows: {}
        };
        nodeManager = {}; // Not deeply used by view itself, mostly orchestration
        view = new ConnectionView({ model, nodeManager });
    });

    test("should interact with DOM on init", () => {
        view.init();
        expect(view.parentContainer.appendChild).toHaveBeenCalledTimes(2); // path + shadow
        expect(view.path).toBeTruthy();
        expect(view.shadowPath).toBeTruthy();
        expect(view.path.getAttribute("marker-end")).toContain("arrow-end");
    });

    test("should update path", () => {
        view.init();
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 100, y: 100 };

        view.updatePath(p1, p2);

        expect(view.path.getAttribute("d")).toBe("M 0 0 L 10 10"); // From mock registry
        expect(view.shadowPath.getAttribute("d")).toBe("M 0 0 L 10 10");
        expect(model.style.applyTo).toHaveBeenCalledWith(view.path);
    });

    test("should retrieve port positions and update", () => {
        view.init();
        const source = { view: { getPortPosition: jest.fn().mockReturnValue({ x: 10, y: 10 }) } };
        const target = { view: { getPortPosition: jest.fn().mockReturnValue({ x: 50, y: 50 }) } };

        view.update(source, target);

        expect(source.view.getPortPosition).toHaveBeenCalled();
        expect(target.view.getPortPosition).toHaveBeenCalled();
        expect(view.path.getAttribute("d")).toBeTruthy();
    });
});
