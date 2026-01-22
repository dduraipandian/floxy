import { EmitterComponent } from "@uiframe/core";
import { NodeModel } from "./NodeModel.js";
import * as constants from "../constants.js";

class BaseNodeView extends EmitterComponent {

  constructor(model, options = {}) {
    if (!(model instanceof NodeModel)) {
      throw new Error("Model must be an instance of NodeModel");
    }
    super({ name: `node-${model.id}` });
    this.model = model;
    this.options = options;
    this.el = null;

    this.contentId = `content-${model.id}`;
    this.zoomGetter = options.zoomGetter || (() => this.options.zoom ?? 1);
    this._content = null;
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 200,
      h: 50,
      label: "Node",
      group: "default",
      module: "default",
      capabilities: constants.DEFAULT_SUPPORTED_CAPABILITIES,
      data: {}
    };
  }

  html() {
    const id = this.model.id;
    const name = this.model.name;
    const x = this.model.x;
    const y = this.model.y;
    const data = this.model.data | {};

    const nodeWidth = this.model.w;
    this._content = this.getNodeElement();

    if (typeof this._content == "string") {
      return this._content;
    }
    return ""
  }

  init() {
    this.el = this.container;
    this.updateContainerAttributes();
    if (this._content) {
      if (typeof this._content === "string") {
        this.el.innerHTML = this._content;
      } else {
        this.el.appendChild(this._content);
      }
    }
    this.createAllPorts()
    this._bindEvents();
    this.bindEvents();
  }

  updateContainerAttributes() {
    this.container.dataset.id = "node-" + this.model.id;
    this.container.dataset.name = this.model.name;
    this.container.dataset.module = this.model.module;
    this.container.dataset.group = this.model.group;

    this.container.style.top = `${this.model.y}px`;
    this.container.style.left = `${this.model.x}px`;
    this.container.style.width = `${this.model.w}px`;
    this.container.style.height = `${this.model.h}px`;
    this.container.style.position = "absolute";
    this.container.classList.add("flow-node");
  }

  createAllPorts() {
    const inputPorts = this.createPorts({ type: "input", count: this.model.inputs });
    const outputPorts = this.createPorts({ type: "output", count: this.model.outputs });
    const close = this.createClose();

    this.el.prepend(inputPorts)
    this.el.appendChild(outputPorts);
    this.el.appendChild(close);
  }

  destroy() {
    this.el?.remove();
    this.el = null;
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

  createPorts({ type, count }) {
    const portContainer = document.createElement("div");
    portContainer.className = `flow-ports-column flow-ports-${type}`;

    for (let i = 0; i < count; i++) {
      const port = document.createElement("div");
      port.className = "flow-port";
      port.dataset.type = type;
      port.dataset.index = i;
      port.dataset.nodeId = this.model.id;
      portContainer.appendChild(port);
    }

    return portContainer;
  }

  createClose() {
    const close = document.createElement("button");
    close.className = "btn-danger btn-close node-close border rounded shadow-none m-1";
    close.dataset.nodeId = this.model.id;
    close.setAttribute("aria-label", "Close");
    return close;
  }

  _bindEvents() {
    console.debug("FLOW: Bind events", this.name);
    // node click
    this.bindMouseDown();

    // close button
    this.bindRemoveNode();

    // output ports
    this.bindOutputPorts();

    // input ports
    this.bindInputPorts();
  }

  bindRemoveNode() {
    // close button
    this.el.querySelector(".node-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit(constants.NODE_REMOVED_EVENT, { id: this.model.id });
    });
  }

  bindMouseDown() {
    this.el.addEventListener("mousedown", (e) => {
      this.emit(constants.NODE_POINTER_DOWN_EVENT, { event: e });
    });
  }

  bindInputPorts() {
    this.el.querySelectorAll(".flow-ports-input .flow-port").forEach((port) => {
      port.addEventListener("mouseup", (e) => {
        console.debug("FLOW: Port connect end", e);
        this.emit(constants.PORT_CONNECT_END_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }

  bindOutputPorts() {
    this.el.querySelectorAll(".flow-ports-output .flow-port").forEach((port) => {
      port.addEventListener("mousedown", (e) => {
        console.debug("FLOW: Port connect start", e);
        this.emit(constants.PORT_CONNECT_START_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }

  resizeNode() {
    this.el.style.width = `${this.model.w}px`;
    this.el.style.height = `${this.model.h}px`;
    this.resize?.();
  }

  getNodeElement() { }
  bindEvents() { }
}

export { BaseNodeView };
