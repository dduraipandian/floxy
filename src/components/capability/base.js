class BaseCapability {
  constructor({ component, options = {} }) {
    this.component = component;
    this.options = options;
    this.attached = false;
  }

  static get capability() {
    throw new Error("Static property capability must be implemented in the subclass");
  }

  static get removal_event() {
    throw new Error("Static property removal_event must be implemented in the subclass");
  }

  isSupported() {
    const iss = this.component.isCapabilitySupported(this.constructor.capability);
    console.debug("FLOW: Is behavior supported", this.constructor.capability, iss);
    return iss;
  }

  _attach() {
    if (!this.isSupported()) return;
    if (!this.gaurd()) return;

    this.attach();
    this.attached = true;
    this.component.on(this.constructor.removal_event, this.destroy);
  }

  gaurd() {
    return true;
  }

  attach() {
    throw new Error("Method 'attach()' must be implemented in the subclass");
  }

  detach() {
    throw new Error("Method 'detach()' must be implemented in the subclass");
  }

  destroy() {
    this.detach();
    this.component.off(this.constructor.removal_event, this.destroy);
  }
}

export { BaseCapability };
