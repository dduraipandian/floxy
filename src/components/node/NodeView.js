import { EmitterComponent } from "@uiframe/core";
import { NodeViewBase } from "./views/base.js";


class NodeView extends EmitterComponent {
    constructor(model, view, options = {}) {
        if (view instanceof NodeViewBase) {
            throw new Error("View must be an instance of NodeViewBase");
        }
        super({ name: `node-view-${model.id}` });
        this.model = model;
        this.view = new view(model, options);
        this.el = null;
    }

    renderInto(container) {
        this.el = this.view.getNodeElement();
        this.el.classList.add("floxy-node");
        this.el.dataset.nodeId = this.model.id;

        container.appendChild(this.el);
    }

    init() {
        this.view.render();
        this.view.bindEvents();
    }

    render() {
        this.view.render();
    }

    destroy() {
        this.view.destroy();
        this.el = null;
    }

    behaviorSupported(name) {
        return this.view.supportedBehaviors.includes(name) && this.model.supportedBehaviors.includes(name);
    }
}

export { NodeView };
