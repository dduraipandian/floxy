import { BaseNodeView } from "../../../NodeView.js";
import * as constants from "../../../../constants.js";

const SUPPORTED_BEHAVIORS = [
    constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE,
];

class EllipseNodeView extends BaseNodeView {
    static supportedBehaviors = SUPPORTED_BEHAVIORS;

    static get name() {
        return "workflow-action";
    }

    getNodeElement() {
        const el = document.createElement("div");
        el.className = "flow-node ellipse-node";

        // SVG shape
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 60");
        svg.setAttribute("width", "200");
        svg.setAttribute("height", "150");
        svg.classList.add("node-shape");

        const ellipse = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "ellipse"
        );
        ellipse.setAttribute("cx", "50");
        ellipse.setAttribute("cy", "30");
        ellipse.setAttribute("rx", "48");
        ellipse.setAttribute("ry", "28");
        ellipse.setAttribute("stroke", "grey");
        ellipse.setAttribute("fill", "none");

        svg.appendChild(ellipse);

        const content = document.createElement("div");
        content.style.position = "absolute";
        content.style.left = "50%";
        content.style.top = "50%";
        content.style.transform = "translate(-50%, -50%)";
        content.textContent = this.model.name ?? "Start";

        el.appendChild(svg);
        el.appendChild(content);
        return el;
    }

    init() {
        super.init();
        this.container.style.width = "200px";
        this.container.style.height = "150px";
    }
}

export { EllipseNodeView };
