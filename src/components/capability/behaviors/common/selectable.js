import { BaseBehavior } from "../../base.js";
import * as constants from "../../../constants.js";

let GLOABL_ACTIVE = null;

function setActive(behavior) {
  GLOABL_ACTIVE = behavior;
}

function getActive() {
  return GLOABL_ACTIVE;
}

class CommonSelectableBehavior extends BaseBehavior {
  // TODO: this should be removed when multiple nodes can be selected and tabs added.

  constructor({ component, options = {} }) {
    super({ component, options });
    this.selected = false;
  }

  static get capability() {
    return constants.COMMON_CAPABILITIES.SELECTABLE;
  }

  attach() {
    const view = this.component.view;

    const _onPointerDown = (e) => {
      e.stopPropagation();
      this.select(e.clientX, e.clientY);
    };

    this._onPointerDown = _onPointerDown.bind(this);
    view.attachEvent("click", this._onPointerDown);
  }

  select(cx, cy) {
    if (getActive() === this) return;

    getActive()?.deselect();

    this.selected = true;
    this.component.select(cx, cy);
    setActive(this);
  }

  deselect() {
    if (!this.component.destroyed) {
      this.component.deselect();
    }
    setActive(null);
    this.selected = false;
  }

  detach() {
    if (this._onPointerDown && this.component?.view?.el) {
      this.component.view.detachEvent("click", this._onPointerDown);
    }
  }

  static get select_event() {
    throw new Error("Static property select_event must be implemented in the subclass");
  }

  static get deselect_event() {
    throw new Error("Static property deselect_event must be implemented in the subclass");
  }
}

export { CommonSelectableBehavior, getActive };
