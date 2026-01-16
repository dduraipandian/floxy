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
  }

  renderInto(container) {
    this.el = this.getNodeElement();
    this.el.classList.add("floxy-node");
    this.el.dataset.nodeId = this.model.id;

    container.appendChild(this.el);
  }

  init() {
    this.render();
    this.bindEvents();
  }

  destroy() {
    this.el?.remove();
    this.el = null;
  }

  behaviorSupported(name) {
    return (
      this.constructor.supportedBehaviors.includes(name) &&
      this.model.supportedBehaviors.includes(name)
    );
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

  getNodeElement() {
    throw new Error("Method 'getNodeElement()' must be implemented in the subclass");
  }

  render() {
    throw new Error("Method 'render()' must be implemented in the subclass");
  }

  bindEvents() {
    throw new Error("Method 'bindEvents()' must be implemented in the subclass");
  }
}

export { BaseNodeView };
