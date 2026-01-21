import { BaseNodeView } from "../../../NodeView.js";
import * as constants from "../../../../constants.js";

const SUPPORTED_BEHAVIORS = [
    constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE,
    constants.DEFAULT_NODE_BEHAVIORS.EDITABLE_LABEL,
    constants.DEFAULT_NODE_BEHAVIORS.RESIZABLE
];

class EllipseNodeView extends BaseNodeView {
    constructor(model, options = {}) {
        super(model, options);
        this.ellipse = null;
    }

    static get modelDefaults() {
        return {
            inputs: 1,
            outputs: 1,
            w: 200,
            h: 150,
            label: "Action",
            module: "diagram",
            group: "workflow",
            name: "action",
            behaviors: SUPPORTED_BEHAVIORS,
            data: {}
        };
    }

    getNodeElement() {
        const el = document.createElement("div");
        el.className = "flow-node ellipse-node";

        // SVG shape
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // svg.setAttribute("viewBox", "0 0 100 60");
        // svg.setAttribute("width", "100%");
        // svg.setAttribute("height", "100%");
        // svg.setAttribute("preserveAspectRatio", "none");
        svg.classList.add("node-shape");

        const ellipse = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "ellipse"
        );
        // ellipse.setAttribute("cx", "50");
        // ellipse.setAttribute("cy", "30");
        // ellipse.setAttribute("rx", "48");
        // ellipse.setAttribute("ry", "28");
        ellipse.setAttribute("stroke", "grey");
        ellipse.setAttribute("fill", "none");

        svg.appendChild(ellipse);

        const content = document.createElement("div");
        content.classList.add("node-label");
        content.setAttribute("contenteditable", false);
        content.textContent = this.model.label;

        el.appendChild(svg);
        el.appendChild(content);

        this.ellipse = ellipse;
        return el;
    }

    init() {
        super.init();
        this.container.style.width = `${this.model.w}px`;
        this.container.style.height = `${this.model.h}px`;
        this.resize();
    }

    resize() {
        const { w, h } = this.model;
        const rx = (w - 1) / 2;
        const ry = (h - 1) / 2;
        this.ellipse.setAttribute("cx", rx);
        this.ellipse.setAttribute("cy", ry);
        this.ellipse.setAttribute("rx", rx);
        this.ellipse.setAttribute("ry", ry);
    }
}

export { EllipseNodeView };
