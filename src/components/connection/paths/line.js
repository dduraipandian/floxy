import { pathRegistry } from "./PathRegistry.js";

pathRegistry.register("line", ({ p1, p2, options = {} }) => `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
