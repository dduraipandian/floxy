import { DagValidator } from "../src/components/plugins/dag-validator.js";

describe("DagValidator", () => {
  let validator;

  beforeEach(() => {
    validator = new DagValidator();
  });

  test("should allow non-cyclic connections", () => {
    // A -> B
    const result = validator.onConnectionAttempt({ outNodeId: "A", inNodeId: "B" });
    expect(result.valid).toBe(true);
    validator.onConnectionAdded({ outNodeId: "A", inNodeId: "B" });

    // B -> C
    const result2 = validator.onConnectionAttempt({ outNodeId: "B", inNodeId: "C" });
    expect(result2.valid).toBe(true);
    validator.onConnectionAdded({ outNodeId: "B", inNodeId: "C" });
  });

  test("should detect simple cycle (A->B, B->A)", () => {
    validator.onConnectionAdded({ outNodeId: "A", inNodeId: "B" });

    const result = validator.onConnectionAttempt({ outNodeId: "B", inNodeId: "A" });
    expect(result.valid).toBe(false);
    expect(result.message).toContain("cyclic");
  });

  test("should detect indirect cycle (A->B, B->C, C->A)", () => {
    validator.onConnectionAdded({ outNodeId: "A", inNodeId: "B" });
    validator.onConnectionAdded({ outNodeId: "B", inNodeId: "C" });

    const result = validator.onConnectionAttempt({ outNodeId: "C", inNodeId: "A" });
    expect(result.valid).toBe(false);
  });

  test("should clear cache on connection removal", () => {
    validator.onConnectionAdded({ outNodeId: "A", inNodeId: "B" });
    validator.onConnectionAdded({ outNodeId: "B", inNodeId: "C" });

    // C -> A should fail
    expect(validator.onConnectionAttempt({ outNodeId: "C", inNodeId: "A" }).valid).toBe(false);

    // Remove A -> B
    validator.onConnectionRemoved({ outNodeId: "A", inNodeId: "B" });

    // Now C -> A should be valid (path A-> ... -> C is broken)
    // Wait, if we remove A->B, the graph is A   B->C.
    // Adding C->A creates C->A, B->C. No cycle.
    expect(validator.onConnectionAttempt({ outNodeId: "C", inNodeId: "A" }).valid).toBe(true);
  });

  test("should handle disabled state", () => {
    validator.enabled = false;
    validator.onConnectionAdded({ outNodeId: "A", inNodeId: "B" });

    // B -> A cyclic but validator disabled
    const result = validator.onConnectionAttempt({ outNodeId: "B", inNodeId: "A" });
    expect(result.valid).toBe(true);
  });
});
