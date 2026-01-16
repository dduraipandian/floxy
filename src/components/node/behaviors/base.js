import { BehaviorRegistry } from "./BehaviorRegistry.js";
import * as constants from "../constants.js";

class BaseNodeBehavior {
  constructor({ options = {} }) {
    this.options = options;
    BehaviorRegistry.register(this.constructor);
  }

  static get behavior() {
    throw new Error("Static property behavior must be implemented in the subclass");
  }

  isSupported(node) {
    return node.view.behaviorSupported(this.constructor.behavior);
  }

  _attach(node) {
    this.node = node;
    const supported = this.isSupported(node);
    console.debug("FLOW: Attach behavior", this.constructor.behavior, supported);

    if (!supported) {
      return;
    }
    this.attach(node);
    node.on(constants.NODE_REMOVED_EVENT, this.destroy);
  }

  // eslint-disable-next-line no-unused-vars
  attach(node) {
    throw new Error("Method 'attach()' must be implemented in the subclass");
  }

  detach() {
    throw new Error("Method 'detach()' must be implemented in the subclass");
  }

  destroy() {}
}

export { BaseNodeBehavior };
