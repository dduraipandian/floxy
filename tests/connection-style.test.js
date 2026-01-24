import { ConnectionStyle } from "../src/components/connection/ConnectionStyle.js";

describe("ConnectionStyle", () => {
  test("should initialize with defaults", () => {
    const style = new ConnectionStyle();
    expect(style.width).toBe(2);
    expect(style.path).toBe("bezier");
    expect(style.animated).toBe(false);
    expect(style.arrows.end).toBe(true);
  });

  test("should override defaults", () => {
    const style = new ConnectionStyle("line", {
      width: 4,
      animated: true,
      arrows: { end: false, start: true },
    });
    expect(style.width).toBe(4);
    expect(style.path).toBe("line");
    expect(style.animated).toBe(true);
    expect(style.arrows.end).toBe(false);
    expect(style.arrows.start).toBe(true);
  });

  test("should mark states", () => {
    const style = new ConnectionStyle();

    style.markBad(true);
    expect(style.bad).toBe(true);

    style.markHover(true);
    expect(style.hover).toBe(true);

    style.markSelected(true);
    expect(style.selected).toBe(true);

    style.markTemp(true);
    expect(style.temp).toBe(true);

    style.markExecution(true);
    expect(style.execution).toBe(true);
  });

  test("should apply styles to path element", () => {
    const style = new ConnectionStyle("line", { width: 5, stroke: "red", dash: "5 5" });
    // Use plain object to test logic without JSDOM interference
    const mockPath = {
      style: {},
      classList: {
        toggle: jest.fn(),
        add: jest.fn(),
        remove: jest.fn(),
      },
    };

    style.applyTo(mockPath);

    expect(mockPath.style.stroke).toBe("red");
    expect(mockPath.style.strokeWidth).toBe(5);
    expect(mockPath.style.strokeDasharray).toBe("5 5");

    expect(mockPath.classList.toggle).toHaveBeenCalledWith("animated", false);
    expect(mockPath.classList.toggle).toHaveBeenCalledWith("flow-connection-temp", false);
    expect(mockPath.classList.toggle).toHaveBeenCalledWith("flow-connection-path-bad", false);
    expect(mockPath.classList.toggle).toHaveBeenCalledWith("selected", false);
  });

  test("should fallback to bezier if path not found", () => {
    const style = new ConnectionStyle("non-existent");
    expect(style.path).toBe("bezier");
  });
});
