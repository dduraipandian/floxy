import { EmitterComponent } from "@uiframe/core";
import { DragHandler } from "../../utils.js";
import * as constants from "../constants.js";

class DraggableBehavior extends EmitterComponent {
  constructor({ zoomGetter }) {
    super({ name: "node-draggable" });
    this.zoomGetter = zoomGetter;
  }

  attach(node) {
    this.node = node;

    const supported = node.view.behaviorSupported(constants.NODE_BEHAVIORS.DRAGGABLE);
    console.debug("FLOW: Attach draggable behavior", supported, node);

    if (!supported) {
      return;
    }

    this.dragHandler = new DragHandler(
      node.view.el,
      (x, y) => {
        node.move(x, y);
      },
      { x: node.model.x, y: node.model.y },
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
