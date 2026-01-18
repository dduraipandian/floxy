import { EmitterComponent } from "@uiframe/core";

class ConnectionModel extends EmitterComponent {
    constructor({
        id,
        outNodeId,
        outPort,
        inNodeId,
        inPort,
        data = {},
    }) {
        super({ name: `connection-${id}` });

        this.id = id;
        this.outNodeId = outNodeId;
        this.outPort = outPort;
        this.inNodeId = inNodeId;
        this.inPort = inPort;
        this.data = data;

        this.selected = false;
    }

    get source() {
        return {
            nodeId: this.outNodeId,
            portIndex: this.outPort,
        }
    }

    get target() {
        return {
            nodeId: this.inNodeId,
            portIndex: this.inPort,
        }
    }
}

export { ConnectionModel };
