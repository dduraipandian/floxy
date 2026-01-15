import { EmitterComponent } from "@uiframe/core";

class BaseNodeBehavior extends EmitterComponent {
  constructor() {
    super({ name: "node-base-behavior" });
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
  }

  // eslint-disable-next-line no-unused-vars
  attach(node) {
    throw new Error("Method 'attach()' must be implemented in the subclass");
  }

  detach() {
    throw new Error("Method 'detach()' must be implemented in the subclass");
  }
}

export { BaseNodeBehavior };
