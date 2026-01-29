import { BaseCapability } from "../capability/base.js";

class BaseCommand extends BaseCapability {
  static get group() {
    return "default";
  }

  static get capability() {
    throw new Error("Static property capability must be implemented in the subclass");
  }

  get clearSelection() {
    return false;
  }

  canExecute(component) {
    return this.isSupported(component);
  }

  run(flow, manager, component) {
    if (!this.canExecute(component)) {
      flow.notification?.error(`${this.constructor.capability} is not supported`);
      return false;
    }
    return this.execute(flow, manager, component);
  }

  // eslint-disable-next-line no-unused-vars
  execute(flow, manager, component) {
    throw new Error("Method 'execute()' must be implemented in the subclass");
  }

  static get label() {
    return this.capability;
  }
  static get order() {
    return 0;
  }
  static get icon() {
    return "";
  }
  static get toolclass() {
    return "";
  }
}

export { BaseCommand };
