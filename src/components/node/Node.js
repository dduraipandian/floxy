import { EmitterComponent } from "@uiframe/core";
import * as constants from "../constants.js";

class Node extends EmitterComponent {
  constructor({ model, view, behaviors = new Set() }) {
    super({ name: `node-${model.id}` });

    this.id = model.id;
    this.model = model;
    this.view = view;
    this.behaviors = behaviors;
    this.destroyed = false;
  }

  html() {
    return "";
  }

  setBehaviors(behaviors) {
    this.behaviors = behaviors;
  }

  addBehavior(behavior) {
    this.behaviors.add(behavior);
  }

  removeBehavior(behavior) {
    this.behaviors.delete(behavior);
  }

  renderInto(container) {
    console.debug("FLOW: Render node", this.view);
    this.view.renderInto(container);
  }

  init() {
    this.behaviors.forEach((b) => b._attach());
  }

  move(x, y) {
    this.model.move(x, y);
    this.view.move();
    this.emit(constants.NODE_MOVED_EVENT, { id: this.model.id, x, y });
  }

  onResize(w, h) {
    this.model.resize(w, h);
    this.view.resizeNode();
    this.emit(constants.NODE_RESIZED_EVENT, { id: this.model.id, w, h });
  }

  destroy() {
    this.behaviors.forEach((b) => b.detach?.());
    this.behaviors.clear();
    this.view.destroy();
    this.view = null;
    this.behaviors = null;
    this.model = null;
    this.destroyed = true;
  }

  isCapabilitySupported(capability) {
    return this.model.capabilities.includes(capability);
  }

  get x() {
    return this.model.x;
  }

  get y() {
    return this.model.y;
  }

  select() {
    this.view.setSelected(true);
    this.emit(constants.NODE_SELECTED_EVENT, { id: this.model.id });
  }

  deselect() {
    this.view.setSelected(false);
    this.emit(constants.NODE_DESELECTED_EVENT, { id: this.model.id });
  }
}

export { Node };
