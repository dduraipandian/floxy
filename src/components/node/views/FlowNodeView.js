import { BaseNodeView } from "../NodeView.js";
import * as constants from "../../constants.js";

const DEFAULT_SUPPORTED_BEHAVIORS = [
  constants.DEFAULT_NODE_BEHAVIORS.SELECTABLE,
  constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE,
];

class FlowNodeView extends BaseNodeView {
  static supportedBehaviors = DEFAULT_SUPPORTED_BEHAVIORS;

  constructor(model, options = {}) {
    super(model, options);
  }

  static get name() {
    return "flow-node-view";
  }

  getNodeElement() {
    if (this.el) {
      return this.el;
    }

    const el = document.createElement("div");
    const id = this.model.id;
    const name = this.model.name;
    const inputs = this.model.inputs;
    const outputs = this.model.outputs;
    const x = this.model.x;
    const y = this.model.y;

    const contentHtml = this.model.contentHtml;
    const data = this.model.data | {};

    const nodeWidth = this.model.w;

    const inputHtml = `
            <div class="flow-port"
                data-type="input"
                data-node-id="${id}"
                data-index="{{index}}">
            </div>
        `;

    const outputHtml = `
            <div class="flow-port"
                data-type="output"
                data-node-id="${id}"
                data-index="{{index}}">
            </div>
        `;

    el.innerHTML = `
            <div id="node-${id}"
                data-id="${id}"
                class="flow-node rounded"
                data-data="${JSON.stringify(data)}"
                style="top:${y}px; left:${x}px; width:${nodeWidth}px; height: fit-content">

            <div class="flow-ports-column flow-ports-in">
                ${Array.from({ length: inputs }, (_, i) => inputHtml.replace("{{index}}", i)).join("")}
            </div>

            <div class="flow-node-content card w-100">
                <div class="card-header">${name}</div>
                <div class="card-body">${contentHtml || ""}</div>
            </div>

            <div class="flow-ports-column flow-ports-out">
                ${Array.from({ length: outputs }, (_, i) => outputHtml.replace("{{index}}", i)).join("")}
            </div>

            <button type="button"
                data-node-id="${id}"
                class="btn-danger btn-close node-close border rounded shadow-none m-1"
                aria-label="Close">
            </button>
        </div>
    `;

    this.el = el.firstElementChild;
    this.el.style.position = "absolute";

    return this.el;
  }

  bindEvents() {
    console.debug("FLOW: Bind events", this.name);
    // node click
    this.bindMouseDown();

    // close button
    this.bindRemoveNode();

    // output ports
    this.bindOutputPorts();

    // input ports
    this.bindInputPorts();
  }

  bindRemoveNode() {
    // close button
    this.el.querySelector(".node-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit(constants.NODE_REMOVED_EVENT, { id: this.model.id });
    });
  }

  bindMouseDown() {
    this.el.addEventListener("mousedown", (e) => {
      this.emit(constants.NODE_POINTER_DOWN_EVENT, { event: e });
    });
  }

  bindInputPorts() {
    this.el.querySelectorAll(".flow-ports-in .flow-port").forEach((port) => {
      port.addEventListener("mouseup", (e) => {
        console.debug("FLOW: Port connect end", e);
        this.emit(constants.PORT_CONNECT_END_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }

  bindOutputPorts() {
    this.el.querySelectorAll(".flow-ports-out .flow-port").forEach((port) => {
      port.addEventListener("mousedown", (e) => {
        console.debug("FLOW: Port connect start", e);
        this.emit(constants.PORT_CONNECT_START_EVENT, {
          nodeId: this.model.id,
          portIndex: port.dataset.index,
          event: e,
        });
      });
    });
  }
}

export { FlowNodeView };
