import { CommonSelectableBehavior } from "../../behaviors/common/SelectableBehavior.js";
import * as constants from "../../constants.js";

class SelectableBehavior extends CommonSelectableBehavior {
  static type = "node";

  constructor({ type, component, options = {} }) {
    super({ type, component, options });
    this.node = this.component;
  }

  static get behavior() {
    return constants.COMMON_CAPABILITIES.SELECTABLE;
  }

  static get removal_event() {
    return constants.NODE_REMOVED_EVENT;
  }

  static get select_event() {
    return constants.NODE_SELECTED_EVENT;
  }

  static get deselect_event() {
    return constants.NODE_DESELECTED_EVENT;
  }
}

export { SelectableBehavior };
