import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class ResizableBehavior extends BaseNodeBehavior {
    static get behavior() {
        return "resizable";
    }

    attach(node) {
        const el = node.view.el;

        const handle = document.createElement("div");
        handle.className = "resize-handle resize-br";
        el.appendChild(handle);

        let startX, startY, startW, startH;

        const onMouseDown = (e) => {
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            startW = node.model.w;
            startH = node.model.h;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (e) => {
            const dx = (e.clientX - startX) / node.view.zoomGetter();
            const dy = (e.clientY - startY) / node.view.zoomGetter();

            const w = Math.max(80, startW + dx);
            const h = Math.max(40, startH + dy);
            node.onResize(w, h);
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        handle.addEventListener("mousedown", onMouseDown);
    }

    detach() {
        handle.removeEventListener("mousedown", onMouseDown);
    }
}

export { ResizableBehavior };
