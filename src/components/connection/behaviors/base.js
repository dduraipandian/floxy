import * as constants from "../../constants.js";
import { BaseBehavior } from "../../behaviors/base.js";

class BaseConnectionBehavior extends BaseBehavior {
  static type = "connection";

  constructor({ type, component, options = {} }) {
    super({ type, component, options });
    this.connection = this.component;
  }

  static get removal_event() {
    return constants.CONNECTION_REMOVED_EVENT;
  }
}

export { BaseConnectionBehavior };
