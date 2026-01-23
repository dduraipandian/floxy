import { DragHandler } from "../../utils.js";
import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class DraggableBehavior extends BaseNodeBehavior {
  static get behavior() {
    return constants.NODE_CAPABILITIES.MOVABLE;
  }

  gaurd() {
    if (typeof this.node.view.move !== "function") {
      console.warn("Node view does not have move method to support draggable behavior");
      return false;
    }
    return true;
  }

  attach() {
    const view = this.node.view;

    this.dragHandler = new DragHandler(
      view.el,
      (x, y) => {
        this.node.move(x, y);
      },
      { x: this.node.x, y: this.node.y },
      { x: 0, y: 0 },
      view.zoomGetter
    );

    this.dragHandler.registerDragEvent();
  }

  detach() {
    this.dragHandler?.destroy();
  }
}

export { DraggableBehavior };
