import { EmitterComponent } from "@uiframe/core";

import * as constants from "../constants.js";

class ConnectionView extends EmitterComponent {
    #p1 = null;
    #p2 = null;

    constructor({ model, nodeManager, options = {} }) {
        super({ name: `connection-view-${model.id}` });
        this.model = model;
        this.nodeManager = nodeManager;
        this.path = null;
        this.shadowPath = null;

        this.options = options;
        this.container = null;

        this.#p1 = null;
        this.#p2 = null;
        this.adjustEnd = false;
        this.adjustStart = false;
        this.adjustOffset = 12;
        this.endMarker = true;
        this.startMarker = true;
    }

    html() {
        return ""
    }

    init() {
        this.endMarker = this.model.arrows?.end ?? this.endMarker;
        this.startMarker = this.model.arrows?.start ?? this.startMarker;

        this.path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );
        this.path.classList.add("flow-connection-path");
        this.path.dataset.id = this.model.id;

        this.parentContainer.appendChild(this.path);
        this.container = this.path;

        this.initShadowPath();
        this.bindEvents();

        if (this.startMarker) {
            this.adjustStart = true;
            this.path.setAttribute("marker-start", "url(#arrow-start)");
        }

        if (this.endMarker) {
            this.adjustEnd = true;
            this.path.setAttribute("marker-end", "url(#arrow-end)");
        }
    }

    initShadowPath() {
        this.shadowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

        this.shadowPath.classList.add("flow-connection-path");
        this.shadowPath.style.stroke = "transparent";
        this.shadowPath.style.strokeWidth = 18;
        this.shadowPath.style.fill = "none";
        this.shadowPath.style.pointerEvents = "stroke";

        this.parentContainer.appendChild(this.shadowPath);
    }

    applyStyle() {
        const s = this.model.style;

        if (s.stroke) this.path.style.stroke = s.stroke;
        if (s.width) this.path.style.strokeWidth = s.width;

        if (s.dash) {
            this.path.style.strokeDasharray = s.dash;
        } else {
            this.path.style.strokeDasharray = "";
        }

        this.path.classList.toggle("animated", !!s.animated);
    }

    #getAdjustedPoints(p1, p2) {
        let adjustedP1 = p1;
        let adjustedP2 = p2;

        if (this.adjustEnd) {
            adjustedP2 = {
                x: p2.x - this.adjustOffset,
                y: p2.y,
            };
        }

        if (this.adjustStart) {
            adjustedP1 = {
                x: p1.x + this.adjustOffset + 16,
                y: p1.y,
            }
        }

        return { p1: adjustedP1, p2: adjustedP2 };
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

        this.#update(p1, p2);
    }

    updateTempPath(p1, p2) {
        this.addStyleClass("flow-connection-temp");
        this.addStyleClass("selected");
        this.path.style.pointerEvents = "none";
        this.#update(p1, p2);
    }

    #update(p1, p2) {
        const adjustedPoints = this.#getAdjustedPoints(p1, p2);
        this.updatePath(adjustedPoints.p1, adjustedPoints.p2);
    }

    updatePath(p1, p2, meta = {}) {
        const type = this.model.pathType || "bezier";
        this.#p1 = p1 ?? this.#p1;
        this.#p2 = p2 ?? this.#p2;

        const dir1 = meta.sourceDir || "right";
        const dir2 = meta.targetDir || "left";

        let d;
        switch (type) {
            case "straight":
                d = this._straight(p1, p2);
                break;

            case "orthogonal":
                d = this._orthogonal_v2(p1, p2, dir1, dir2);
                break;

            case "step":
                d = this._step_v2(p1, p2, dir1);
                break;

            case "bezier":
            default:
                d = this._bezier(p1, p2);
        }

        this.path.setAttribute("d", d);
        this.shadowPath.setAttribute("d", d);
        this.applyStyle();
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
        this.shadowPath?.remove();
        this.path = null;
        this.shadowPath = null;
    }

    bindEvents() {
        this.bindSelect();
        this.bindShadowSelect();
    }

    bindSelect() {
        this.path.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.emit(constants.CONNECTION_CLICKED_EVENT, this.model.id);
        });
    }
    bindShadowSelect() {
        const addStyleClass = this.addStyleClass.bind(this);
        const removeStyleClass = this.removeStyleClass.bind(this);
        this.shadowPath.addEventListener('mouseover', e => addStyleClass("path-hover"));
        this.shadowPath.addEventListener('mouseout', e => removeStyleClass("path-hover"));

        this.shadowPath.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.emit(constants.CONNECTION_CLICKED_EVENT, this.model.id);
        });
    }

    _straight(p1, p2) {
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    _orthogonal(p1, p2) {
        const midX = (p1.x + p2.x) / 2;

        return `
            M ${p1.x} ${p1.y}
            L ${midX} ${p1.y}
            L ${midX} ${p2.y}
            L ${p2.x} ${p2.y}
        `;
    }

    _step(p1, p2) {
        const offset = Math.max(40, Math.abs(p2.x - p1.x) / 2);
        const x1 = p1.x + offset;
        const x2 = p2.x - offset;

        return `
            M ${p1.x} ${p1.y}
            L ${x1} ${p1.y}
            L ${x1} ${p2.y}
            L ${p2.x} ${p2.y}
        `;
    }

    _orthogonal_v2(p1, p2, dir1 = "right", dir2 = "left") {
        const GAP = 30;

        let points = [{ ...p1 }];

        // Horizontal → Vertical
        if (dir1 === "right" || dir1 === "left") {
            const dx = dir1 === "right" ? GAP : -GAP;
            const midX = p1.x + dx;

            points.push({ x: midX, y: p1.y });
            points.push({ x: midX, y: p2.y });
        }
        // Vertical → Horizontal
        else {
            const dy = dir1 === "down" ? GAP : -GAP;
            const midY = p1.y + dy;

            points.push({ x: p1.x, y: midY });
            points.push({ x: p2.x, y: midY });
        }

        points.push({ ...p2 });

        return this._polyline(points);
    }

    _polyline(points) {
        return points
            .map((p, i) =>
                i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
            )
            .join(" ");
    }

    _step_v2(p1, p2, dir1 = "right") {
        const OFFSET = 40;

        let points = [{ ...p1 }];

        if (dir1 === "right") {
            points.push({ x: p1.x + OFFSET, y: p1.y });
            points.push({ x: p1.x + OFFSET, y: p2.y });
        } else if (dir1 === "left") {
            points.push({ x: p1.x - OFFSET, y: p1.y });
            points.push({ x: p1.x - OFFSET, y: p2.y });
        } else if (dir1 === "down") {
            points.push({ x: p1.x, y: p1.y + OFFSET });
            points.push({ x: p2.x, y: p1.y + OFFSET });
        } else {
            points.push({ x: p1.x, y: p1.y - OFFSET });
            points.push({ x: p2.x, y: p1.y - OFFSET });
        }

        points.push({ ...p2 });

        return this._polyline(points);
    }


}


export { ConnectionView };