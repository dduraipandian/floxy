import { BaseNodeView } from "../../../NodeView.js";

class DefaultView extends BaseNodeView {
  constructor(model, options = {}) {
    super(model, options);
  }

  static get name() {
    return "default-node-view";
  }

  getNodeElement() {
    return `
        <div class="node" style="display: grid; place-items: center;">
            <div class="node-label">${this.model.label}</div>
        </div>
    `;
  }
}

export { DefaultView };
