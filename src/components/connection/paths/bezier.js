import { pathRegistry } from "./PathRegistry.js";

pathRegistry.register("bezier", ({ p1, p2, options = {} }) => {
  const c = options.curvature ?? 0.7;
  const hx1 = p1.x + Math.abs(p2.x - p1.x) * c;
  const hx2 = p2.x - Math.abs(p2.x - p1.x) * c;

  return `M ${p1.x} ${p1.y}
            C ${hx1} ${p1.y} ${hx2} ${p2.y} ${p2.x} ${p2.y}`;
});
