import { EmitterComponent } from "@uiframe/core";

class Connection extends EmitterComponent {
    constructor({ model, view, nodeManager }) {
        super({ name: `connection-${model.id}` });

        this.model = model;
        this.view = view;
        this.nodeManager = nodeManager;
        this.destroyed = false;

        this._source = null;
        this._target = null;

        this.id = this.model.id;
    }

    get outNodeId() {
        return this.model.outNodeId;
    }

    get inNodeId() {
        return this.model.inNodeId;
    }

    get inPort() {
        return this.model.inPort
    }

    get outPort() {
        return this.model.outPort
    }

    get source() {
        if (!this._source)
            this._source = {
                nodeId: this.model.source.nodeId,
                portIndex: this.model.source.portIndex,
            };
        return this._source;
    }

    get target() {
        if (!this._target)
            this._target = {
                nodeId: this.model.target.nodeId,
                portIndex: this.model.target.portIndex,
            };
        return this._target;
    }

    renderInto(container) {
        this.view.renderInto(container);
        this.init();
    }

    init() {
        this.update();
    }

    update() {
        const sourceNode = this.nodeManager.getNode(
            this.model.source.nodeId
        );
        const targetNode = this.nodeManager.getNode(
            this.model.target.nodeId
        );
        this.view.update(sourceNode, targetNode);
    }

    updateWithXY(x, y) {
        const sourceNode = this.nodeManager.getNode(
            this.source.nodeId
        );

        if (!sourceNode) return;

        const p1 = sourceNode.view.getPortPosition({
            type: "output",
            index: this.source.portIndex,
        });

        const p2 = { x, y };

        this.view.updateTempPath(p1, p2);
    }

    markBadPath() {
        this.view.addStyleClass("flow-connection-path-bad");
    }

    destroy() {
        this.view.path?.remove();
        this.view.destroy();
        this.view = null;
        this.model = null;
        this.nodeManager = null;
        this.destroyed = true;
    }

    clearBadPath() {
        this.view.removeStyleClass("flow-connection-path-bad")
    }
}

export { Connection };