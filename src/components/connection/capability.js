import * as constants from "../constants.js";
import { BaseBehavior } from "../capability/base.js";
import { CapabilityRegistry } from "../capability/registry.js";

class ConnectionCapability extends BaseBehavior {
  constructor({ component, options = {} }) {
    super({ component, options });
    this.connection = this.component;
  }

  static get removal_event() {
    return constants.CONNECTION_REMOVED_EVENT;
  }
}

const defaultBehaviorRegistry = new CapabilityRegistry();
const defaultCommandRegistry = new CapabilityRegistry();

export { ConnectionCapability, defaultBehaviorRegistry, defaultCommandRegistry };
