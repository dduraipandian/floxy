import { BehaviorRegistry } from "../src/components/node/behaviors/BehaviorRegistry.js";
import { DraggableBehavior } from "../src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "../src/components/node/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "../src/components/node/behaviors/EditableLabelBehavior.js";
import { ResizableBehavior } from "../src/components/node/behaviors/ResizableBehavior.js";
import * as constants from "../src/components/constants.js";

// Mock Utils
jest.mock("../src/components/utils.js", () => ({
    DragHandler: class {
        constructor(el, handler, initial, start, zoom) {
            this.registerDragEvent = jest.fn();
            this.destroy = jest.fn();
            this.handler = handler; // expose for testing
        }
    }
}));

document.execCommand = jest.fn();

describe("Node Behaviors", () => {

    describe("BehaviorRegistry", () => {
        test("should register and retrieve behavior", () => {
            // DraggableBehavior is not auto-registered in its own file usually, 
            // but might be in index or manually.
            // Let's register manually to test registry.
            class TestBehavior {
                static get behavior() { return "test-behavior"; }
            }
            BehaviorRegistry.register(TestBehavior);

            expect(BehaviorRegistry.get("test-behavior")).toBe(TestBehavior);
            expect(BehaviorRegistry.getAll()).toContain(TestBehavior);
        });

        test("should throw if behavior static property missing", () => {
            class BadBehavior { }
            expect(() => BehaviorRegistry.register(BadBehavior)).toThrow();
        });
    });

    describe("DraggableBehavior", () => {
        let node;
        let behavior;

        beforeEach(() => {
            node = {
                view: {
                    el: document.createElement("div"),
                    move: jest.fn(),
                    zoomGetter: () => 1
                },
                isCapabilitySupported: jest.fn().mockReturnValue(true),
                x: 0, y: 0,
                move: jest.fn(),
                on: jest.fn(),
                off: jest.fn()
            };
            behavior = new DraggableBehavior({ node });
        });

        test("should attach drag handler if supported", () => {
            behavior._attach();
            expect(behavior.dragHandler).toBeDefined();
            expect(behavior.dragHandler.registerDragEvent).toHaveBeenCalled();
        });

        test("should move node via handler", () => {
            behavior._attach();
            // simulate move callback from DragHandler
            behavior.dragHandler.handler(10, 20);
            expect(node.move).toHaveBeenCalledWith(10, 20);
        });

        test("should detach and destroy handler", () => {
            behavior._attach();
            behavior.detach();
            expect(behavior.dragHandler.destroy).toHaveBeenCalled();
        });

        test("should not attach drag handler if move method is not present in the view", () => {
            node.view.move = undefined;
            behavior._attach();
            expect(behavior.attached).toBe(false);
            expect(behavior.dragHandler).toBeUndefined();
        });
    });

    describe("SelectableBehavior", () => {
        let node;
        let behavior;

        beforeEach(() => {
            node = {
                view: {
                    el: document.createElement("div"),
                },
                isCapabilitySupported: jest.fn().mockReturnValue(true),
                select: jest.fn(),
                deselect: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                destroyed: false
            };
            behavior = new SelectableBehavior({ node });
        });

        afterEach(() => {
            // cleanup static active
            if (SelectableBehavior.active) SelectableBehavior.active.deselect();
        });

        test("should select on mousedown", () => {
            behavior._attach();
            const spy = jest.spyOn(behavior, "select");

            node.view.el.dispatchEvent(new MouseEvent("mousedown"));

            expect(spy).toHaveBeenCalled();
            expect(behavior.selected).toBe(true);
            expect(SelectableBehavior.active).toBe(behavior);
            expect(node.select).toHaveBeenCalled();
        });

        test("should deselect previous active behavior", () => {
            behavior.select();

            const node2 = { ...node, select: jest.fn(), deselect: jest.fn(), view: { el: document.createElement("div") } };
            const behavior2 = new SelectableBehavior({ node: node2 });
            behavior2._attach();

            behavior2.select();

            expect(behavior.selected).toBe(false);
            expect(node.deselect).toHaveBeenCalled();
            expect(behavior2.selected).toBe(true);
            expect(SelectableBehavior.active).toBe(behavior2);
        });
    });

    describe("EditableLabelBehavior", () => {
        let node;
        let behavior;
        let labelEl;

        beforeEach(() => {
            labelEl = document.createElement("div");
            labelEl.className = "node-label";
            node = {
                id: 1,
                view: {
                    el: document.createElement("div"),
                },
                model: { label: "Initial Label" },
                isCapabilitySupported: jest.fn().mockReturnValue(true),
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn()
            };
            node.view.el.appendChild(labelEl);
            behavior = new EditableLabelBehavior({ node });
        });

        test("should make label editable on dblclick", () => {
            behavior._attach();
            labelEl.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
            expect(labelEl.contentEditable).toBe("true");
        });

        test("should update model and emit event on blur", () => {
            behavior._attach();
            labelEl.contentEditable = "true";
            labelEl.textContent = "Updated Label";
            labelEl.dispatchEvent(new FocusEvent("blur"));

            expect(labelEl.contentEditable).toBe("false");
            expect(node.model.label).toBe("Updated Label");
            expect(node.emit).toHaveBeenCalledWith(constants.NODE_LABEL_UPDATED_EVENT, {
                id: node.id,
                label: "Updated Label"
            });
        });

        test("should blur on Enter key", () => {
            behavior._attach();
            labelEl.focus();
            const spy = jest.spyOn(labelEl, "blur");
            labelEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("ResizableBehavior", () => {
        let node;
        let behavior;

        beforeEach(() => {
            node = {
                id: 1,
                x: 10, y: 10, w: 100, h: 50,
                view: {
                    el: document.createElement("div"),
                    zoomGetter: () => 1
                },
                isCapabilitySupported: jest.fn().mockReturnValue(true),
                on: jest.fn(),
                off: jest.fn(),
                onResize: jest.fn()
            };
            behavior = new ResizableBehavior({ node });
        });

        test("should add resize handle on attach", () => {
            behavior._attach();
            expect(node.view.el.querySelector(".resize-handle")).toBeTruthy();
            expect(behavior.dragHandler).toBeDefined();
        });

        test("should call onResize when handle is dragged", () => {
            behavior._attach();
            // Drag to (150, 100). New size: w = 150-10 = 140 (but min 150), h = 100-10 = 90.
            // Wait, logic is Math.max(150, x - node.x). x is 150, node.x is 10. 150-10 = 140. Max(150, 140) = 150.
            // Let's drag to 200, 100. w = 200-10 = 190. h = 100-10 = 90.
            behavior.dragHandler.handler(200, 100);
            expect(node.onResize).toHaveBeenCalledWith(190, 90);
        });

        test("should enforce minimum dimensions", () => {
            behavior._attach();
            behavior.dragHandler.handler(20, 20); // Resulting in small dims
            expect(node.onResize).toHaveBeenCalledWith(150, 50);
        });

        test("should remove handle on detach", () => {
            behavior._attach();
            const handle = node.view.el.querySelector(".resize-handle");
            behavior.detach();
            expect(handle.parentElement).toBeNull();
        });
    });
});
