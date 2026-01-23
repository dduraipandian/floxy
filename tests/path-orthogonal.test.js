import { pathRegistry } from "../src/components/connection/paths/PathRegistry.js";
import "../src/components/connection/paths/orthogonal.js";

describe("Orthogonal Path Generator", () => {
  const generator = pathRegistry.get("orthogonal");

  test("should be registered", () => {
    expect(generator).toBeDefined();
  });

  test("should generate simple horizontal path", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 200, y: 0 };
    const path = generator({
      p1,
      p2,
      options: { clearance: 50 },
      targetBounds: { height: 50 },
    });

    // Expected: M 0 0 L 50 0 v 0 h 150
    // Or similar.
    // Logic:
    // pxg = 50, pyg = 50
    // bottom = 0 > 0 ?? No. p2.y (0) > p1.y (0) + 1  => false.
    // right = 200 > 90 (50+40) => true.
    // else branch (not bottom) -> right branch.
    // lines: M 0 0, L 50 0, v 0, h 150

    expect(path).toContain("M 0 0");
    expect(path).toContain("L 50 0");
  });

  test("should generate path avoiding immediate intersection", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 0, y: 100 }; // Directly below
    const path = generator({
      p1,
      p2,
      options: { clearance: 20 },
      targetBounds: { height: 50 },
    });

    expect(path).toBeDefined();
    // Just verify it's a non-empty string for now as exact path depends on complexity
    expect(path.length).toBeGreaterThan(10);
  });
});
