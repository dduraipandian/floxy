import { BaseNodeView } from "./NodeView.js";
import * as constants from "../constants.js";

class SVGNodeView extends BaseNodeView {
  constructor(model, options = {}) {
    super(model, options);
    this.shapeName = "svg";
    this.shape = null;
    this.label = null;
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 200,
      h: 100,
      label: "SVG",
      module: "default",
      group: "default",
      name: "svg",
      capabilities: constants.DEFAULT_SUPPORTED_CAPABILITIES,
      data: {},
    };
  }

  getNodeElement() {
    const el = document.createElement("div");
    el.className = `flow-node ${this.shapeName}-node`;

    // SVG shape
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("node");

    this.shape = this.createShape();
    this.label = this.createLabel();

    this.shape.classList.add("shape");
    svg.appendChild(this.shape);

    el.appendChild(svg);
    el.appendChild(this.label);

    return el;
  }

  init() {
    super.init();
    this.resize();
  }

  createLabel() {
    const content = document.createElement("div");
    content.classList.add("node-label");
    content.setAttribute("contenteditable", false);
    content.textContent = this.model.label;
    return content;
  }

  createShape() {
    if (!constants.SVGShapes.includes(this.shapeName)) {
      throw new Error(`Can not create give ${this.shapeName} svg shape`);
    }

    const shape = document.createElementNS("http://www.w3.org/2000/svg", this.shapeName);
    return shape;
  }

  resize() {
    throw new Error("Method 'resize()' must be implemented in the subclass");
  }
}

export { SVGNodeView };
