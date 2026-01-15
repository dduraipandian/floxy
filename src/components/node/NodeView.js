import { EmitterComponent } from "@uiframe/core";
import { BaseNodeView } from "./base.js";
import * as constants from "./constants.js";

class NodeView extends EmitterComponent {
  constructor(model, view, options = {}) {
    if (view instanceof BaseNodeView) {
      throw new Error("View must be an instance of BaseNodeView");
    }
    super({ name: `node-view-${model.id}` });
    this.model = model;
    this.view = new view(model, options);
    this.el = null;
  }

  renderInto(container) {
    this.el = this.view.getNodeElement();
    this.el.classList.add("floxy-node");
    this.el.dataset.nodeId = this.model.id;

    container.appendChild(this.el);
  }

  init() {
    this.view.render();
    this.view.bindEvents();

    this.propagateEvent(constants.PORT_CONNECT_START_EVENT, this.view);
    this.propagateEvent(constants.PORT_CONNECT_END_EVENT, this.view);
    this.propagateEvent(constants.NODE_REMOVE_EVENT, this.view);
  }

  render() {
    this.view.render();
  }

  destroy() {
    this.view.destroy();
    this.el = null;
  }

  behaviorSupported(name) {
    return (
      this.view.supportedBehaviors.includes(name) && this.model.supportedBehaviors.includes(name)
    );
  }

  propagateEvent(event, instance) {
    instance.on(event, (e) => this.emit(event, e));
  }

  querySelector(selector) {
    return this.el.querySelector(selector);
  }
}

export { NodeView };
