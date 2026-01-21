import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class SelectableBehavior extends BaseNodeBehavior {
  // TODO: this should be removed when multiple nodes can be selected and tabs added.
  static active = null;

  constructor({ node, options = {} }) {
    super({ node, options });
    this.selected = false;
  }

  static get behavior() {
    return constants.NODE_CAPABILITIES.SELECTABLE;
  }

  attach() {
    const view = this.node.view;

    const _onPointerDown = (e) => {
      e.stopPropagation();
      this.select();
    };

    this._onPointerDown = _onPointerDown.bind(this);
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
