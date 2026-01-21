import { BaseNodeView } from "../../../NodeView.js";
import * as constants from "../../../../constants.js";

const DEFAULT_SUPPORTED_BEHAVIORS = [
  constants.DEFAULT_NODE_BEHAVIORS.SELECTABLE,
  constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE,
];

class DefaultView extends BaseNodeView {
  static supportedBehaviors = DEFAULT_SUPPORTED_BEHAVIORS;

  constructor(model, options = {}) {
    super(model, options);
  }

  static get name() {
    return "default-node-view";
  }

  getNodeElement() {
    return `
        <div class="card card-header w-100" style="display: grid; place-items: center;">
            ${this.model.label}
        </div>
    `;
  }
}

export { DefaultView };
