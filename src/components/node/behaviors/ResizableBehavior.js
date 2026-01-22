import { BaseNodeBehavior } from "./base.js";
import { DragHandler } from "../../utils.js";
import * as constants from "../../constants.js";

class ResizableBehavior extends BaseNodeBehavior {
    static get behavior() {
        return constants.NODE_CAPABILITIES.RESIZABLE;
    }

    attach() {
        const el = this.node.view.el;
        const view = this.node.view;

        this.handle = document.createElement("div");
        this.handle.className = "resize-handle resize-br";
        el.appendChild(this.handle);

        this.dragHandler = new DragHandler(
            this.handle,
            (x, y) => {
                const w = Math.max(150, x - this.node.x);
                const h = Math.max(50, y - this.node.y);
                this.node.onResize(w, h);
            },
            { x: this.node.x + this.node.w, y: this.node.y + this.node.h },
            { x: 0, y: 0 },
            view.zoomGetter,
            "nwse-resize",
            "nwse-resize"
        );

        this.dragHandler.registerDragEvent();
    }

    detach() {
        this.handle?.remove();
        this.dragHandler?.destroy();
    }
}

export { ResizableBehavior };
