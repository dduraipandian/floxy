import { pathRegistry } from "./PathRegistry.js";

/* eslint-disable no-unused-vars */
pathRegistry.register(
  "orthogonal",
  ({
    p1,
    p2,
    sourceBounds,
    targetBounds,
    sourceDir = "right",
    targetDir = "left",
    options = {},
  }) => {
    // TODO: temporary connections get overlapped with target node, as line generation doesn't aware of target node position
    // fix this later with whole flow context
    const tragetHeight = targetBounds?.height || 50;
    const verticalDirection = options.direction === "vertical" ? true : false;
    const GAP = options.clearance ?? 60;
    const bufferCrossing = 40;

    const pxg = p1.x + GAP;
    const pyg = p1.y + GAP;

    // based on target node position to source node
    // target node is bottom right side.
    const bottom = verticalDirection ? p2.y > pyg + bufferCrossing : p2.y + 1 > p1.y;
    const right = verticalDirection ? p2.x + 1 > p1.x : p2.x > pxg + bufferCrossing;

    const lines = [`M ${p1.x} ${p1.y}`]; // move to source position
    lines.push(`L ${pxg} ${p1.y}`); // create line to source top-right direction

    let hy = Math.abs(p2.y - p1.y); // target node is below/above source node
    let lx = Math.abs(p1.x - p2.x);

    if (bottom) {
      if (right) {
        lines.push(`v ${hy}`); // relative vertical line
        lines.push(`h ${lx - GAP}`); // relative horizontal line
      } else {
        let hy1 = (hy - tragetHeight) * 0.9;
        let hy2 = hy - hy1;
        let lx1 = Math.abs(pxg + bufferCrossing - p2.x);

        lines.push(`v ${hy1}`); // relative vertical line
        lines.push(`h ${-1 * lx1}`); // relative horizontal line
        lines.push(`v ${hy2}`); // relative vertical line
        lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line
      }
    } else {
      if (right) {
        lines.push(`v ${-1 * hy}`); // relative vertical line
        lines.push(`h ${lx - GAP}`); // relative horizontal line
      } else {
        let hy1 = (hy - tragetHeight) * 0.9;
        let hy2 = hy - hy1;
        let lx1 = Math.abs(pxg + bufferCrossing - p2.x);

        lines.push(`v ${-1 * hy1}`); // relative vertical line
        lines.push(`h ${-1 * lx1}`); // relative horizontal line
        lines.push(`v ${-1 * hy2}`); // relative vertical line
        lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line
      }
    }
    return lines.join(" ");
  }
);
