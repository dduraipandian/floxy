import { BasePrimitiveElement } from "./base.js";

class IntegerInputElement extends BasePrimitiveElement {
  constructor({ id, label, name, value = 0, options = {} }) {
    super({ id, label, name, value, options });
    this.min = options.min;
    this.max = options.max;
    this.step = options.step || 1;
  }

  renderHtml() {
    return `<div class="form-floating">
                    <input 
                    type="number"         
                    id="${this.id}"
                    name="${this.name}"
                    class="${this.classNames}"
                    autocomplete="${this.autocomplete}"
                    placeholder="${this.placeholder || this.name}" 
                    data-type="integer"
                    ${this.min !== undefined ? `min="${this.min}"` : ""}
                    ${this.max !== undefined ? `max="${this.max}"` : ""}
                    step="${this.step}"
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
                    ${this.helpText ? `<div id="${this.id}-help" class="form-text ms-1 text-white">${this.helpText}</div>` : ""}
                </div>`;
  }

  getValue() {
    const value = super.getValue();
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const intValue = parseInt(value, 10);
    if (isNaN(intValue)) {
      console.warn(`Invalid integer value for ${this.id}: ${value}`);
      return null;
    }

    return intValue;
  }
}

export default IntegerInputElement;
