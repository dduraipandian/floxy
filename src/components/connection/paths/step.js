import { pathRegistry } from "./PathRegistry.js";

pathRegistry.register("step", ({
    p1, p2,
    sourceBounds,
    targetBounds,
    sourceDir = "right",
    targetDir = "left",
    options = {}
}) => {
    const OFFSET = 40;

    let points = [{ ...p1 }];

    if (sourceDir === "right") {
        points.push({ x: p1.x + OFFSET, y: p1.y });
        points.push({ x: p1.x + OFFSET, y: p2.y });
    } else if (sourceDir === "left") {
        points.push({ x: p1.x - OFFSET, y: p1.y });
        points.push({ x: p1.x - OFFSET, y: p2.y });
    } else if (sourceDir === "down") {
        points.push({ x: p1.x, y: p1.y + OFFSET });
        points.push({ x: p2.x, y: p1.y + OFFSET });
    } else {
        points.push({ x: p1.x, y: p1.y - OFFSET });
        points.push({ x: p2.x, y: p1.y - OFFSET });
    }

    points.push({ ...p2 });

    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
});
