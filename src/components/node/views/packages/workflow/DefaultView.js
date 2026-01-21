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
        <div class="card card-header w-100" style="display: grid; place-items: center;">
            ${this.model.label}
        </div>
    `;
  }
}

export { DefaultView };
