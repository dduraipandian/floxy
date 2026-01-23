import { DragHandler } from "../src/components/utils.js";

describe("DragHandler", () => {
    let element;
    let onMoveHandler;
    let dragHandler;

    beforeEach(() => {
        element = document.createElement("div");
        document.body.appendChild(element);
        onMoveHandler = jest.fn();
        dragHandler = new DragHandler(element, onMoveHandler);
        dragHandler.registerDragEvent();
    });

    afterEach(() => {
        dragHandler.destroy();
        document.body.innerHTML = "";
        jest.clearAllMocks();
    });

    test("should initialize correctly", () => {
        expect(dragHandler.element).toBe(element);
        expect(dragHandler.onMoveHandler).toBe(onMoveHandler);
        expect(dragHandler.isDragging).toBe(false);
    });

    test("should start dragging on mousedown", () => {
        element.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
        expect(dragHandler.isDragging).toBe(true);
        expect(dragHandler.dragStartPosition).toEqual({ x: 100, y: 100 });
    });

    test("should update position on mousemove", () => {
        // Mock RAF to just store callback and not execute immediately
        let rafCallback;
        const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
            rafCallback = cb;
            return 1;
        });

        element.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));

        // Now trigger mousemove - this sets the new position internally
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 150 }));

        // Manually trigger the RAF callback to simulate frame and trigger onMoveHandler
        if (rafCallback) rafCallback();

        expect(dragHandler.elementX).toBe(50); // 0 + (150-100)
        expect(dragHandler.elementY).toBe(50); // 0 + (150-100)
        expect(onMoveHandler).toHaveBeenCalledWith(50, 50);

        rafSpy.mockRestore();
    });

    test("should stop dragging on mouseup", () => {
        // Mock RAF to avoid infinite loop possibility even if not testing move
        const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

        element.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 150, clientY: 150 }));
        expect(dragHandler.isDragging).toBe(false);

        rafSpy.mockRestore();
    });

    test("should ignore right click", () => {
        element.dispatchEvent(new MouseEvent("mousedown", { button: 2 }));
        expect(dragHandler.isDragging).toBe(false);
    });
});
