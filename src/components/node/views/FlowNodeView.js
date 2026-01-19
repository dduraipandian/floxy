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
    this.name = "Process Node";
  }

  static get name() {
    return "flow-node-view";
  }

  getNodeElement() {
    const name = this.model.name ?? this.name;
    return `
        <div class="card w-100">
            <div class="card-header">${name}</div>
            <div class="card-body" id="${this.contentId}">${this.model.contentHtml}</div>
        </div>
    `;
  }
}

export { FlowNodeView };
