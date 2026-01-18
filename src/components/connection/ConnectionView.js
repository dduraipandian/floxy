import { EmitterComponent } from "@uiframe/core";

import * as constants from "../constants.js";

class ConnectionView extends EmitterComponent {
    constructor({ model, nodeManager, options = {} }) {
        super({ name: `connection-view-${model.id}` });
        this.model = model;
        this.nodeManager = nodeManager;
        this.path = null;

        this.options = options;
        this.container = null;
    }

    html() {
        return ""
    }

    init() {
        this.path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );
        this.path.classList.add("flow-connection-path");
        this.path.dataset.id = this.model.id;

        this.parentContainer.appendChild(this.path);
        this.container = this.path;

        this.bindEvents();
    }

    update(source, target) {
        if (!source || !target) return;

        const p1 = source.view.getPortPosition({
            type: "output",
            index: this.model.source.portIndex,
        });

        const p2 = target.view.getPortPosition({
            type: "input",
            index: this.model.target.portIndex,
        });

        if (!p1 || !p2) return;

        this.updatePath(p1, p2);
    }

    updatePath(p1, p2) {
        // console.debug("FLOW: connection", p1, p2)
        this.path.setAttribute("d", this._bezier(p1, p2));
    }

    updateTempPath(p1, p2) {
        this.updatePath(p1, p2);
        this.path.setAttribute("class", "flow-connection-path selected flow-connection-temp");
        this.path.style.pointerEvents = "none";
    }

    addStyleClass(className) {
        this.path.classList.add(className);
    }

    removeStyleClass(className) {
        this.path.classList.remove(className);
    }

    _bezier(p1, p2) {
        const curvature = 0.5;
        const hx1 = p1.x + Math.abs(p2.x - p1.x) * curvature;
        const hx2 = p2.x - Math.abs(p2.x - p1.x) * curvature;

        return `M ${p1.x} ${p1.y} C ${hx1} ${p1.y} ${hx2} ${p2.y} ${p2.x} ${p2.y}`;
    }

    destroy() {
        this.path?.remove();
        this.path = null;
    }

    bindEvents() {
        this.bindSelect();
    }

    bindSelect() {
        this.path.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.emit(constants.CONNECTION_CLICKED_EVENT, this.model.id);
        });
    }
}


export { ConnectionView };