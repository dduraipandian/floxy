import { CommonSelectableBehavior } from "../../../capability/behaviors/common/selectable.js";
import * as constants from "../../../constants.js";

class SelectableBehavior extends CommonSelectableBehavior {
  constructor({ component, options = {} }) {
    super({ component, options });
    this.node = this.component;
  }

  static get capability() {
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
