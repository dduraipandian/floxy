import { SVGNodeView } from "../../../SVGNodeView.js";
import * as constants from "../../../../constants.js";

const SUPPORTED_CAPABILITIES = [
    constants.NODE_CAPABILITIES.MOVABLE,
    constants.NODE_CAPABILITIES.EDITABLE_LABEL,
    constants.NODE_CAPABILITIES.RESIZABLE,
    constants.NODE_CAPABILITIES.SELECTABLE
];

class EllipseNodeView extends SVGNodeView {
    constructor(model, options = {}) {
        super(model, options);
        this.shapeName = "ellipse";
        this.ellipse = null;
    }

    static get modelDefaults() {
        return {
            inputs: 1,
            outputs: 1,
            w: 200,
            h: 100,
            label: "Action",
            module: "diagram",
            group: "workflow",
            name: "action",
            capabilities: SUPPORTED_CAPABILITIES,
            data: {}
        };
    }

    createShape() {
        const ellipse = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "ellipse"
        );
        this.ellipse = ellipse;
        return this.ellipse
    }

    updateShape() { }

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
