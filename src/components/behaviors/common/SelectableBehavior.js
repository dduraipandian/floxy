import { BaseConnectionBehavior } from "../../connection/behaviors/base.js";
import * as constants from "../../constants.js";

class CommonSelectableBehavior extends BaseConnectionBehavior {
  // TODO: this should be removed when multiple nodes can be selected and tabs added.
  static active = null;

  constructor({ type, component, options = {} }) {
    super({ type, component, options });
    this.selected = false;
  }

  static get behavior() {
    return constants.COMMON_CAPABILITIES.SELECTABLE;
  }

  attach() {
    const view = this.component.view;

    const _onPointerDown = (e) => {
      e.stopPropagation();
      this.select();
    };

    this._onPointerDown = _onPointerDown.bind(this);
    view.attachEvent("click", this._onPointerDown);
  }

  select() {
    if (this.selected) {
      this.deselect();
      return;
    }
    this.constructor.active?.deselect();

    this.selected = true;
    this.component.select();
    this.constructor.active = this;
  }

  deselect() {
    if (!this.component.destroyed) {
      this.component.deselect();
    }
    this.constructor.active = null;
    this.selected = false;
  }

  detach() {
    if (this._onPointerDown && this.component?.view?.el) {
      this.component.view.el.removeEventListener("click", this._onPointerDown);
    }
  }

  static get select_event() {
    throw new Error("Static property select_event must be implemented in the subclass");
  }

  static get deselect_event() {
    throw new Error("Static property deselect_event must be implemented in the subclass");
  }
}

export { CommonSelectableBehavior };
