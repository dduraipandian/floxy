import { EmitterComponent } from "@uiframe/core";

class PortView extends EmitterComponent {
  constructor({ portId, direction, type }) {
    super({ name: `port-${portId}` });
    this.portId = portId;
    this.direction = direction;
    this.type = type;
    this.el = null;
  }

  renderInto(container) {
    this.el = document.createElement("div");
    this.el.className = `flow-port ${this.direction}`;
    this.el.dataset.portId = this.portId;
    container.appendChild(this.el);
  }
}

export { PortView };
