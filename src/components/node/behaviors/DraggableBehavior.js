import { DragHandler } from "../../utils.js";
import { BaseNodeBehavior } from "./base.js";
import * as constants from "../constants.js";

class DraggableBehavior extends BaseNodeBehavior {
  constructor({ zoomGetter }) {
    super({ name: "node-draggable" });
    this.zoomGetter = zoomGetter;
  }

  static get behavior() {
    return constants.NODE_BEHAVIORS.DRAGGABLE;
  }

  attach(node) {
    const view = node.view;

    this.dragHandler = new DragHandler(
      view.el,
      (x, y) => {
        node.move(x, y);
      },
      { x: node.x, y: node.y },
      { x: 0, y: 0 },
      this.zoomGetter
    );

    this.dragHandler.registerDragEvent();
  }

  detach() {
    this.dragHandler?.destroy();
  }
}

export { DraggableBehavior };
