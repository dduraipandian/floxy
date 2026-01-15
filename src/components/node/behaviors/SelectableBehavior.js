import { BaseNodeBehavior } from "./base.js";
import * as constants from "../constants.js";

class SelectableBehavior extends BaseNodeBehavior {
  constructor() {
    super({ name: "node-selectable" });
    this.selected = false;
  }

  static get behavior() {
    return constants.NODE_BEHAVIORS.SELECTABLE;
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
    this.selected = true;

    this.node.view.setSelected(true);
    this.node.emit(constants.NODE_SELECTED_EVENT, { id: this.node.model.id });
  }

  detach() {
    if (this._onPointerDown && this.node?.view?.el) {
      this.node.view.el.removeEventListener("mousedown", this._onPointerDown);
    }
  }
}

export { SelectableBehavior };
