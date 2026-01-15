import { EmitterComponent } from "@uiframe/core";
import * as constants from "./constants.js";

class Node extends EmitterComponent {
    constructor({ model, view, behaviors = [] }) {
        super({ name: `node-${model.id}` });

        this.model = model;
        this.view = view;
        this.behaviors = behaviors;
    }

    html() {
        return "";
    }

    renderInto(container) {
        console.log("render node", this.view);
        this.view.renderInto(container);
    }

    init() {
        this.view.init();
        this.behaviors.forEach((b) => b.attach(this));
    }

    move(x, y) {
        this.model.move(x, y);
        this.view.render();
        this.emit(constants.NODE_MOVED_EVENT, { id: this.model.id, x, y });
    }

    destroy() {
        this.behaviors.forEach((b) => b.detach?.());
        this.view.destroy();
    }
}

export { Node };
