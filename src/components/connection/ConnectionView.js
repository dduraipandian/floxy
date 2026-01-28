import { EmitterComponent } from "@uiframe/core";
import { pathRegistry } from "./paths/PathRegistry.js";

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
    this.adjustOffset = 6;
    this.endMarker = true;
    this.startMarker = true;
    this.isTemp = options.isTemp ?? false;
  }

  html() {
    return "";
  }

  init() {
    this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.path.classList.add("flow-connection-path", "connection");
    this.path.setAttribute("id", this.model.id);

    this.parentContainer.appendChild(this.path);
    this.container = this.path;

    this.initShadowPath();
    // this.bindEvents();

    this.applyArrows();
    this.el = this.path;
  }

  static getConnectionKey(outNodeId, outPort, inNodeId, inPort) {
    return `${outNodeId}:${outPort}-${inNodeId}:${inPort}`;
  }

  applyArrows() {
    const arrows = this.model.arrows || {};

    this.endMarker = arrows.end ?? this.endMarker;
    this.startMarker = arrows.start ?? this.startMarker;

    this.path.removeAttribute("marker-start");
    this.path.removeAttribute("marker-end");

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

    this.shadowPath.classList.add("flow-connection-path", "shadow-path");
    this.shadowPath.setAttribute("id", "shadow-" + this.model.id);

    this.shadowPath.style.stroke = "transparent";
    this.shadowPath.style.strokeWidth = 18;
    this.shadowPath.style.fill = "none";

    // shadow path is not required for temp connection.
    // shadow path stroke width is bigger, as accidental click while drawing connection will be detected and creates issue.
    this.shadowPath.style.pointerEvents = this.isTemp ? "none" : "stroke";

    this.parentContainer.appendChild(this.shadowPath);
  }

  applyStyle() {
    this.model.style.applyTo(this.path);
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
      };
    }

    return { p1: adjustedP1, p2: adjustedP2 };
  }

  update(source, target, meta = {}) {
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

    this.#update(p1, p2, meta);
  }

  updateTempPath(p1, p2, meta = {}) {
    this.model.style.markTemp(true);

    this.path.style.pointerEvents = "none";
    this.#update(p1, p2, meta);
  }

  #update(p1, p2, meta = {}) {
    const adjustedPoints = this.#getAdjustedPoints(p1, p2);
    this.updatePath(adjustedPoints.p1, adjustedPoints.p2, meta);
  }

  updatePath(p1, p2, meta = {}) {
    const type = this.model.style.path ?? "bezier";
    this.#p1 = p1 ?? this.#p1;
    this.#p2 = p2 ?? this.#p2;

    const fn = pathRegistry.get(type);

    const d = fn({
      p1: this.#p1,
      p2: this.#p2,
      ...meta,
      zoom: this.options.zoom,
    });

    this.shadowPath.setAttribute("d", d);
    this.path.setAttribute("d", d);
    this.path.setAttribute("p1x", p1.x);
    this.path.setAttribute("p1y", p1.y);
    this.path.setAttribute("p2x", p2.x);
    this.path.setAttribute("p2y", p2.y);

    this.applyStyle();
    this.applyArrows();
  }

  addStyleClass(className) {
    this.path.classList.add(className);
  }

  removeStyleClass(className) {
    this.path.classList.remove(className);
  }

  destroy() {
    this.path?.remove();
    this.shadowPath?.remove();
    this.path = null;
    this.shadowPath = null;
  }

  bindEvents() {
    this.bindShadowSelect();
  }

  bindShadowSelect() {
    this.shadowPath.addEventListener("mouseover", (e) => {
      e.stopPropagation();
      this.model.style.markHover(true);
      this.applyStyle();
    });
    this.shadowPath.addEventListener("mouseout", (e) => {
      e.stopPropagation();
      this.model.style.markHover(false);
      this.applyStyle();
    });
  }

  getBounds() {
    const el = this.el;
    if (!el) return null;

    const bbox = el.getBBox();

    return {
      left: bbox.x,
      top: bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  }

  setSelected(selected) {
    this.model.style.markSelected(selected);
    this.applyStyle();
  }

  attachEvent(event, callback) {
    this.path.addEventListener(event, callback);
    this.shadowPath.addEventListener(event, callback);
  }

  detachEvent(event, callback) {
    this.path.removeEventListener(event, callback);
    this.shadowPath.removeEventListener(event, callback);
  }
}

export { ConnectionView };
