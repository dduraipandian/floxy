import { NodeCapability } from "../../capability.js";
import * as constants from "../../../constants.js";

class EditableLabelBehavior extends NodeCapability {
  static get capability() {
    return constants.CAPABILITIES.EDITABLE_LABEL;
  }

  gaurd() {
    const el = this.node.view.el.querySelector(".node-label");
    if (!el) {
      console.warn("Node view does not have label element to support editable label behavior");
      return false;
    }
    this._el = el;
    return true;
  }

  attach() {
    if (!this._el) return;

    const _onDblClick = (e) => {
      e.stopPropagation();
      this._el.contentEditable = "true";
      this._el.focus();
      document.execCommand("selectAll", false, null);
    };

    const _onBlur = () => {
      this._el.contentEditable = "false";
      this.node.model.label = this._el.textContent.trim();
      this.node.emit(constants.NODE_LABEL_UPDATED_EVENT, {
        id: this.node.id,
        label: this.node.model.label,
      });
    };

    const _onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._el.blur();
      }
    };

    this._onDblClick = _onDblClick.bind(this);
    this._onBlur = _onBlur.bind(this);
    this._onKeyDown = _onKeyDown.bind(this);

    this._el.addEventListener("dblclick", this._onDblClick);
    this._el.addEventListener("blur", this._onBlur);
    this._el.addEventListener("keydown", this._onKeyDown);
  }

  detach() {
    if (this._el) {
      this._el.removeEventListener("dblclick", this._onDblClick);
      this._el.removeEventListener("blur", this._onBlur);
      this._el.removeEventListener("keydown", this._onKeyDown);
      this._el = null;
    }
  }
}

export { EditableLabelBehavior };
