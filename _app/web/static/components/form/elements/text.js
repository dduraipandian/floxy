import { BasePrimitiveElement } from "./base.js";

class TextInputElement extends BasePrimitiveElement {
  constructor({ id, label, name, value = "", options = {} }) {
    super({ id, label, name, value, options });

    // Text-specific options
    this.pattern = options.pattern || ""; // Regex pattern for validation
    this.autocomplete = options.autocomplete || "on"; // Autocomplete attribute for the input
  }

  renderHtml() {
    return `
      <div class="form-floating">
        <input 
          type="text"         
          id="${this.id}"
          name="${this.name}"
          class="${this.classNames}"
          autocomplete="${this.autocomplete}"
          placeholder="${this.placeholder || this.name}" 
          data-type="text"
          ${this.value ? `value="${this.value}"` : ""}
          ${this.classNames ? `class="${this.classNames}"` : ""}
          ${this.style ? `style="${this.style}"` : ""}      
          ${this.helpText ? `aria-describedby="${this.id}-help"` : ""}         
          ${this.pattern ? `pattern="${this.pattern}"` : ""}
          ${this.disabled ? `disabled="${this.disabled}"` : ""}
          ${this.readonly ? `readonly="${this.readonly}"` : ""}
          ${this.required ? `required="${this.required}"` : ""}
        >
        <label class="input-label text-label" for="${this.id}">${this.label}</label>
        ${this.helpText ? `<div id="${this.id}-help" class="form-text ms-1 help-text">${this.helpText}</div>` : ""}
      </div>`;
  }
}

export default TextInputElement;
