import { EmitterComponent } from "@uiframe/core";
import { ConnectionStyle } from "./ConnectionStyle.js";

class ConnectionModel extends EmitterComponent {
    constructor({
        id,
        outNodeId,
        outPort,
        inNodeId,
        inPort,
        data = {},
        pathType = "bezier",
    }) {
        super({ name: `connection-${id}` });

        this.id = id;
        this.outNodeId = outNodeId;
        this.outPort = outPort;
        this.inNodeId = inNodeId;
        this.inPort = inPort;
        this.pathType = pathType;
        this.data = data;

        this.style = {
            width: 2,
            dash: null, // e.g. "5,5"
            animated: true,
            ...data.style,
        };
        this.style = new ConnectionStyle(this.style);
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

    get arrows() {
        return this.style.arrows;
    }
}

export { ConnectionModel };
