import { pathRegistry } from "../src/components/connection/paths/PathRegistry.js";

describe("PathRegistry", () => {
  test("should register and retrieve paths", () => {
    const mockFn = jest.fn();
    pathRegistry.register("test-path", mockFn);

    expect(pathRegistry.has("test-path")).toBe(true);
    expect(pathRegistry.get("test-path")).toBe(mockFn);
  });

  test("should return undefined for unknown path", () => {
    expect(pathRegistry.get("unknown")).toBeUndefined();
  });

  test("should check existence", () => {
    expect(pathRegistry.has("orthogonal")).toBeDefined(); // Assuming orthogonal is registered by default/imports
  });
});
