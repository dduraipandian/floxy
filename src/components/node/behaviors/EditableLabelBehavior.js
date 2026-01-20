import { BaseNodeBehavior } from "./base.js";
import * as constants from "../../constants.js";

class EditableLabelBehavior extends BaseNodeBehavior {
    static get behavior() {
        return "editable-label";
    }

    attach(node) {
        const el = node.view.el.querySelector(".node-label");
        if (!el) return;

        el.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            el.contentEditable = "true";
            el.focus();
            document.execCommand("selectAll", false, null);
        });

        el.addEventListener("blur", () => {
            el.contentEditable = "false";
            node.model.label = el.textContent.trim();
            node.emit(constants.NODE_LABEL_UPDATED_EVENT, {
                id: node.id,
                label: node.model.label,
            });
        });

        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                el.blur();
            }
        });
    }
}

export { EditableLabelBehavior };
