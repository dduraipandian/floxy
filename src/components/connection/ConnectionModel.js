import { EmitterComponent } from "@uiframe/core";
import { ConnectionStyle } from "./ConnectionStyle.js";
import * as constants from "../constants.js";

class ConnectionModel extends EmitterComponent {
  constructor({
    id,
    outNodeId,
    outPort,
    inNodeId,
    inPort,
    capabilities = constants.DEFAULT_SUPPORTED_CONNECTION_CAPABILITIES,
    options = {},
  }) {
    super({ name: `connection-${id}` });

    this.id = id;
    this.outNodeId = outNodeId;
    this.outPort = outPort;
    this.inNodeId = inNodeId;
    this.inPort = inPort;

    this.options = options;
    this.style = {
      width: 2,
      dash: null,
      animated: false,
      ...options.style,
    };
    this.style = new ConnectionStyle(this.pathType, this.style);
    this.capabilities = capabilities;

    // independent connections for diagrams
    this.detachedSource = false;
    this.detachedTarget = false;
    this.frozenPosition = { source: null, target: null };
    this.frozenBounds = { source: null, target: null };
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

  get pathType() {
    return this.options.pathType ?? constants.DEFAULT_CONNECTION_PATH_TYPE;
  }
}

export { ConnectionModel };
