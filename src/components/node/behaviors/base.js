import * as constants from "../../constants.js";
import { BaseBehavior } from "../../behaviors/base.js";

class BaseNodeBehavior extends BaseBehavior {
  static type = "node";

  constructor({ type, component, options = {} }) {
    super({ type, component, options });
    this.node = this.component;
  }

  static get removal_event() {
    return constants.NODE_REMOVED_EVENT;
  }
}

export { BaseNodeBehavior };
