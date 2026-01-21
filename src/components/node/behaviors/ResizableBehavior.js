import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class ResizableBehavior extends BaseNodeBehavior {
    static get behavior() {
        return constants.NODE_CAPABILITIES.RESIZABLE;
    }

    attach() {
        const el = this.node.view.el;

        const handle = document.createElement("div");
        handle.className = "resize-handle resize-br";
        el.appendChild(handle);

        let startX, startY, startW, startH;

        const onMouseDown = (e) => {
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            startW = this.node.model.w;
            startH = this.node.model.h;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (e) => {
            const dx = (e.clientX - startX) / this.node.view.zoomGetter();
            const dy = (e.clientY - startY) / this.node.view.zoomGetter();

            const w = Math.max(80, startW + dx);
            const h = Math.max(40, startH + dy);
            this.node.onResize(w, h);
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        this._onMouseDown = onMouseDown.bind(this);
        handle.addEventListener("mousedown", this._onMouseDown);
        this.handle = handle
    }

    detach() {
        this.handle?.removeEventListener("mousedown", this._onMouseDown);
        this.handle?.remove();
    }
}

export { ResizableBehavior };
