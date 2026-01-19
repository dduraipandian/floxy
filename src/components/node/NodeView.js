import { EmitterComponent } from "@uiframe/core";
import { NodeModel } from "./NodeModel.js";

class BaseNodeView extends EmitterComponent {
  static supportedBehaviors = [];

  constructor(model, options = {}) {
    if (!(model instanceof NodeModel)) {
      throw new Error("Model must be an instance of NodeModel");
    }
    super({ name: `node-view-${model.id}` });
    this.model = model;
    this.options = options;
    this.el = null;

    this.zoomGetter = options.zoomGetter || (() => this.options.zoom ?? 1);
  }

  renderInto(container) {
    this.el = this.getNodeElement();
    this.el.classList.add("floxy-node");
    this.el.dataset.nodeId = this.model.id;

    container.appendChild(this.el);
  }

  init() {
    this.bindEvents();
  }

  destroy() {
    this.el?.remove();
    this.el = null;
  }

  behaviorSupported(name) {
    return this.constructor.supportedBehaviors.includes(name);
  }

  propagateEvent(event, instance) {
    instance.on(event, (e) => this.emit(event, e));
  }

  querySelector(selector) {
    return this.el.querySelector(selector);
  }

  setSelected(selected) {
    this.el.classList.toggle("selected", selected);
  }

  move() {
    // https://stackoverflow.com/questions/7108941/css-transform-vs-position
    // Changing transform will trigger a redraw in compositor layer only for the animated element
    // (subsequent elements in DOM will not be redrawn). I want DOM to be redraw to make connection attached to the port.
    // so using position top/left to keep the position intact, not for the animation.
    // I spent hours to find this out with trial and error.

    this.el.style.top = `${this.model.y}px`;
    this.el.style.left = `${this.model.x}px`;
  }

  getPortPosition({ type, index }) {
    if (!this.el) return null;

    const portEl = this.el.querySelector(`.flow-port[data-type="${type}"][data-index="${index}"]`);

    if (!portEl) return null;

    const nodeRect = this.el.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();

    const zoom = typeof this.zoomGetter === "function" ? this.zoomGetter() : 1;

    const x = (portRect.left - nodeRect.left + portRect.width / 2) / zoom;
    const y = (portRect.top - nodeRect.top + portRect.height / 2) / zoom;

    return {
      x: this.model.x + x,
      y: this.model.y + y,
    };
  }

  getBounds() {
    const el = this.el;
    return {
      left: el.offsetLeft,
      top: el.offsetTop,
      right: el.offsetLeft + el.offsetWidth,
      bottom: el.offsetTop + el.offsetHeight,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  }


  getNodeElement() {
    throw new Error("Method 'getNodeElement()' must be implemented in the subclass");
  }

  bindEvents() {
    throw new Error("Method 'bindEvents()' must be implemented in the subclass");
  }
}

export { BaseNodeView };
