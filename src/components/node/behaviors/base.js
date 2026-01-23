import { BehaviorRegistry } from "./BehaviorRegistry.js";
import * as constants from "../../constants.js";

class BaseNodeBehavior {
  constructor({ node, options = {} }) {
    this.node = node;
    this.options = options;
    this.attached = false;
  }

  static get behavior() {
    throw new Error("Static property behavior must be implemented in the subclass");
  }

  isSupported() {
    const iss = this.node.isCapabilitySupported(this.constructor.behavior);
    console.debug("FLOW: Is behavior supported", this.constructor.behavior, iss);
    return iss;
  }

  _attach() {
    if (!this.isSupported()) return;
    if (!this.gaurd()) return;

    this.attach();
    this.attached = true;
    this.node.on(constants.NODE_REMOVED_EVENT, this.destroy);
  }

  gaurd() {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  attach() {
    throw new Error("Method 'attach()' must be implemented in the subclass");
  }

  detach() {
    throw new Error("Method 'detach()' must be implemented in the subclass");
  }

  destroy() {
    this.detach();
    this.node.off(constants.NODE_REMOVED_EVENT, this.destroy);
  }
}

export { BaseNodeBehavior };
