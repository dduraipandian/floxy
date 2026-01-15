import { EmitterComponent } from "@uiframe/core";
import * as constants from "../constants.js";

class SelectableBehavior extends EmitterComponent {
  constructor() {
    super({ name: "node-selectable" });
    this.selected = false;
  }

  attach(node) {
    this.node = node;
    if (!node.view.behaviorSupported(constants.NODE_BEHAVIORS.SELECTABLE)) {
      return;
    }

    this._onPointerDown = (e) => {
      e.stopPropagation();
      this.select();
    };

    node.view.el.addEventListener("mousedown", this._onPointerDown);
  }

  select() {
    if (this.selected) return;
    this.selected = true;

    this.node.view.setSelected(true);
    this.node.emit(constants.NODE_SELECTED_EVENT, { id: this.node.model.id });
  }

  detach() {
    this.node?.view.el.removeEventListener("mousedown", this._onPointerDown);
  }
}

export { SelectableBehavior };
