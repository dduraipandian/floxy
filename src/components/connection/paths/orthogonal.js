import { pathRegistry } from "./PathRegistry.js";

pathRegistry.register("orthogonal", ({
    p1, p2,
    sourceBounds,
    targetBounds,
    sourceDir = "right",
    targetDir = "left",
    options = {}
}) => {
    const hzDirection = options.direction === "vertical" ? true : false;
    const GAP = options.clearance ?? 60;
    const bufferCrossing = 60;

    const pxg = p1.x + GAP;
    const pyg = p1.y + GAP;

    // based on target node position to source node
    // target node is bottom right side.
    const bottom = hzDirection ? (p2.y > (pyg + bufferCrossing)) : (p2.y > p1.y);
    const right = hzDirection ? (p2.x > (pxg + bufferCrossing)) : (p2.x > p1.x);

    const lines = [`M ${p1.x} ${p1.y}`]; // move to source position
    lines.push(`L ${pxg} ${p1.y}`); // create line to source top-right direction

    let hy = Math.abs(p2.y - p1.y); // target node is below/above source node
    let lx = Math.abs(p1.x - p2.x);
    if (bottom) {
        if (right) {
            lines.push(`v ${hy}`); // relative vertical line
            lines.push(`h ${lx - GAP}`); // relative horizontal line
        } else {
            let hy1 = (hy - targetBounds?.height ?? 0) * .8;
            let hy2 = hy - hy1;
            let lx1 = Math.abs((pxg + bufferCrossing) - p2.x);

            lines.push(`v ${hy1}`); // relative vertical line
            lines.push(`h ${-1 * lx1}`); // relative horizontal line
            lines.push(`v ${hy2}`); // relative vertical line
            lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line       
        }
    }
    else {
        if (right) {
            lines.push(`v ${-1 * hy}`); // relative vertical line
            lines.push(`h ${lx - GAP}`); // relative horizontal line
        } else {
            let hy1 = (hy - targetBounds?.height ?? 0) * .8;
            let hy2 = hy - hy1;
            let lx1 = Math.abs((pxg + bufferCrossing) - p2.x);

            lines.push(`v ${-1 * hy1}`); // relative vertical line
            lines.push(`h ${-1 * lx1}`); // relative horizontal line
            lines.push(`v ${-1 * hy2}`); // relative vertical line
            lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line       
        }
    }
    // if (targetBounds) {

    //     if (pxg + bufferCrossing >= p2.x) {
    //         lines.push(`v ${hy}`); // relative vertical line
    //         lines.push(`h ${hx - GAP}`); // relative horizontal line
    //     }
    //     if (pxg + bufferCrossing >= p2.x) { // source node is right of target node
    //         let hy1 = (hy - targetBounds.height) * .8;
    //         let hx1 = hx + (GAP * 2);

    //         let hy2 = hy - hy1;
    //         if (p1.y > p2.y) { // target node is above source node            
    //             hy2 = -1 * hy2;
    //         }

    //         hx1 = -1 * hx1;
    //         lines.push(`v ${hy1}`); // relative vertical line
    //         lines.push(`h ${hx1}`); // relative horizontal line
    //         lines.push(`v ${hy2}`); // relative vertical line
    //         lines.push(`L ${p2.x} ${p2.y}`); // relative vertical line                    
    //     } else {
    //         lines.push(`v ${hy}`); // relative vertical line
    //         lines.push(`h ${hx - GAP}`); // relative horizontal line
    //     }
    //     return lines.join(" ");
    // }
    return lines.join(" ");
});
