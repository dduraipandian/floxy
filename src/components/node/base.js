import { NodeModel } from "./NodeModel.js";
import { EmitterComponent } from "@uiframe/core";

class BaseNodeView extends EmitterComponent {
  constructor(model, options = {}) {
    if (!(model instanceof NodeModel)) {
      throw new Error("Model must be an instance of NodeModel");
    }
    super({ name: `node-view-${model.id}` });
    this.model = model;
    this.options = options;
    this.el = null;
  }

  getNodeElement() {
    throw new Error("Method 'getNodeElement()' must be implemented in the subclass");
  }

  render() {
    throw new Error("Method 'render()' must be implemented in the subclass");
  }

  bindEvents() {
    throw new Error("Method 'bindEvents()' must be implemented in the subclass");
  }

  destroy() {
    throw new Error("Method 'destroy()' must be implemented in the subclass");
  }
}

export { BaseNodeView };
