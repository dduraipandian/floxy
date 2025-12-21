import { BasePrimitiveElement } from "./base.js";

class ObjectElement extends BasePrimitiveElement {
  constructor({ id, label, name, value = {}, options = {} }) {
    super({ id, label, name, value, options });

    // Object-specific options
    this.autocomplete = options.autocomplete || ""; // Autocomplete attribute
    this.formatJson = options.formatJson || false; // Whether to format JSON

    this.rows = options.rows || 4; // Number of rows for the textarea
    this.cols = options.cols || 50; // Number of columns for the textarea

    this.displayLabel = options.displayLabel === undefined ? true : options.displayLabel; // Whether to display the label

    this.readonly = options.readonly === undefined ? false : options.readonly;

    console.log("ObjectElement options:", this.displayLabel);

    // Override default classNames if not provided
    if (!options.classNames) {
      this.classNames = "form-control form-control-sm text-white w-100";
    }

    // Only stringify the value if it's not already a string
    if (typeof this.value === "object" && this.value !== null) {
      this.value = JSON.stringify(this.value, null, 2);
    }
    // If it's already a string, keep it as is
  }

  renderHtml() {
    return `<div class="form-floating">        
                    <textarea id="${this.id}"
                        class="${this.classNames}"
                        style="${this.style}"
                        name="${this.name}"
                        rows="${this.rows}"
                        cols="${this.cols}"
                        data-type="json"
                        placeholder="${this.placeholder || this.name}"
                        ${this.formatJson ? `onchange="window.formElements['${this.getFormId()}']['${this.id}'].formatJsonValue(this.id)"` : ""}
                        ${this.required}
                        ${this.readonly ? "readonly" : ""}
                        >${this.value}
                    </textarea>
                    ${this.displayLabel ? `<label class="input-label object-label" for="${this.id}">${this.label}</label>` : ""}
                    <div id="${this.id}" class="invalid-feedback">"Invalid json"</div>
                    ${this.helpText ? `<div id="${this.id}-help" class="form-text ms-1 help-text">${this.helpText}</div>` : ""}
                </div>`;
  }

  setValue(value) {
    let data;
    // Ensure the value is a string, even if it's an object
    if (typeof value === "object" && value !== null) {
      data = JSON.stringify(value, null, 2); // Format JSON with indentation
    } else {
      data = String(value); // Convert to string if not an object
    }
    super.setValue(data); // Call the parent method to set the value
  }

  getValue() {
    let data = super.getValue();
    if (!data || data.trim() === "") {
      return null; // Return null for empty values
    }
    try {
      return JSON.parse(data); // Return the parsed JSON object
    } catch (error) {
      console.warn(`Invalid JSON in ObjectElement ${this.id}:`, data);
      return data; // Return the raw string if JSON parsing fails
    }
  }

  formatJsonValue(inputId) {
    const textarea = document.getElementById(inputId);

    if (!textarea) {
      console.warn(`Textarea with id ${inputId} not found`);
      return;
    }

    textarea.classList.remove("is-valid");
    textarea.classList.remove("is-invalid");

    const jsonString = textarea.value;
    if (jsonString === "") {
      return;
    }
    try {
      const jsonValue = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(jsonValue, null, 2); // Format JSON with indentation
      textarea.classList.add("is-valid");
    } catch (error) {
      textarea.classList.add("is-invalid"); // Add invalid class if JSON is invalid
    }
  }
}

export default ObjectElement;
