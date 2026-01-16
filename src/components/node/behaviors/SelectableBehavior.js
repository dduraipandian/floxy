import { BaseNodeBehavior } from "./base.js";
import * as constants from "../constants.js";

class SelectableBehavior extends BaseNodeBehavior {
  static active = null;

  constructor({ options = {} }) {
    super({ options });
    this.selected = false;
  }

  static get behavior() {
    return constants.DEFAULT_NODE_BEHAVIORS.SELECTABLE;
  }

  attach(node) {
    const view = node.view;

    this._onPointerDown = (e) => {
      e.stopPropagation();
      this.select();
    };

    view.el.addEventListener("mousedown", this._onPointerDown);
  }

  select() {
    if (this.selected) return;
    this.constructor.active?.deselect();

    this.selected = true;
    this.node.select();
    this.constructor.active = this;
  }

  deselect() {
    if (!this.node.destroyed) {
      this.node.deselect();
    }
    this.constructor.active = null;
    this.selected = false;
  }

  detach() {
    if (this._onPointerDown && this.node?.view?.el) {
      this.node.view.el.removeEventListener("mousedown", this._onPointerDown);
    }
  }
}

export { SelectableBehavior };
