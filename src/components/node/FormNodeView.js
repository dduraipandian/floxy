import { BaseNodeView } from "./NodeView.js";
import * as constants from "../constants.js";

const DEFAULT_SUPPORTED_CAPABILITIES = [
  constants.COMMON_CAPABILITIES.SELECTABLE,
  constants.CAPABILITIES.MOVABLE,
  constants.CAPABILITIES.EDITABLE_LABEL,
  constants.CAPABILITIES.REMOVABLE,
];

class FormNodeView extends BaseNodeView {
  constructor(model, options = {}) {
    super(model, options);
  }

  static get name() {
    return "form-node-view";
  }

  static get modelDefaults() {
    return {
      inputs: 1,
      outputs: 1,
      w: 250,
      h: 0,
      label: "Form Node",
      module: "workflow",
      group: "form",
      name: "form",
      capabilities: DEFAULT_SUPPORTED_CAPABILITIES,
      data: {},
    };
  }

  getNodeElement() {
    const extras = this.model.extras;
    const htmlFunctionName = extras.html_function;
    let contentHTML =
      "<p style='color: var(--floxy-danger-color);'>HTML function not found to load form node.</p>";

    if (window.flow_form_functions && window.flow_form_functions[htmlFunctionName]) {
      contentHTML = window.flow_form_functions[htmlFunctionName]();
    }

    return `
        <div class="node form-node" style="display: grid; place-items: center; height: fit-content;">
            <div class="node-label">${this.model.label}</div>
            <form class="form-node-body">${contentHTML}</form>
        </div>
    `;
  }

  bindEvents() {
    const form = this.el.querySelector(".form-node-body");

    if (this.model.data.customHtml) {
      form.innerHTML = this.model.data.customHtml;
    }

    const formInputs = this.el.querySelectorAll(".form-node-body input");

    formInputs.forEach((input) => {
      if (!input.name) {
        console.error("Input name is required");
        form.innerHTML =
          "<p style='color: var(--floxy-danger-color);'>Input name is required to load form.</p>";
        return;
      }
    });

    if (!this.model.data.form_values) {
      this.model.data.form_values = {};
    }

    this.loadInitFormData();

    form.addEventListener("input", (e) => {
      this.model.data.form_values[e.target.name] = e.target.value;
    });

    this.container.style.height = "fit-content";
    this.container.style.width = "fit-content";

    form.addEventListener("mousedown", (e) => e.stopPropagation());
    form.addEventListener("keydown", (e) => e.stopPropagation());
  }

  loadInitFormData() {
    const form = this.el.querySelector(".form-node-body");
    const formInputs = form.querySelectorAll("input");

    formInputs.forEach((input) => {
      if (this.model.data.form_values[input.name]) {
        input.value = this.model.data.form_values[input.name];
      }
    });
  }
}

export { FormNodeView };
