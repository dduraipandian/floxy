import { EmitterComponent } from "@uiframe/core";
import { ConnectionStyle } from "./ConnectionStyle.js";

class ConnectionModel extends EmitterComponent {
  constructor({ id, outNodeId, outPort, inNodeId, inPort, pathType = "bezier", options = {} }) {
    super({ name: `connection-${id}` });

    this.id = id;
    this.outNodeId = outNodeId;
    this.outPort = outPort;
    this.inNodeId = inNodeId;
    this.inPort = inPort;
    this.pathType = pathType;

    this.style = {
      width: 2,
      dash: null,
      animated: true,
      ...options.style,
    };
    this.style = new ConnectionStyle(this.style);
  }

  get source() {
    return {
      nodeId: this.outNodeId,
      portIndex: this.outPort,
    };
  }

  get target() {
    return {
      nodeId: this.inNodeId,
      portIndex: this.inPort,
    };
  }

  get arrows() {
    return this.style.arrows;
  }
}

export { ConnectionModel };
