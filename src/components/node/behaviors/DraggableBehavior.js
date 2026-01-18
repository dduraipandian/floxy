import { DragHandler } from "../../utils.js";
import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class DraggableBehavior extends BaseNodeBehavior {
  constructor({ options = {} }) {
    super({ options });
  }

  static get behavior() {
    return constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE;
  }

  attach(node) {
    typeof node.view.move === "function";
    const view = node.view;

    this.dragHandler = new DragHandler(
      view.el,
      (x, y) => {
        node.move(x, y);
      },
      { x: node.x, y: node.y },
      { x: 0, y: 0 },
      node.view.zoomGetter
    );

    this.dragHandler.registerDragEvent();
  }

  detach() {
    this.dragHandler?.destroy();
  }
}

export { DraggableBehavior };
