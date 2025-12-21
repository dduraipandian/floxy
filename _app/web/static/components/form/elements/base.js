class BaseElement {
  constructor({ id, label, name, value, options = {} }) {
    if (!label || !name || !id) {
      throw new Error("label, name, and id are required parameters.");
    }

    this.id = id; // Unique identifier for the element
    this.label = label; // Label for the element
    this.name = name; // Name attribute for the element
    this.originalValue = value !== undefined ? value : ""; // Original value for reset functionality
    this.value = value !== undefined ? value : ""; // Current value
    this.options = options; // Additional options
    this.formId = options.formId || null; // Parent form ID

    this.classNames = options.classNames || ""; // CSS class for styling
    this.style = options.style || ""; // Inline styles for the element

    this.registerElement(this); // Register the element globally for forms access
  }

  registerElement(element) {
    // Register the element globally for forms access
    if (typeof window !== "undefined" && window.formElements && element.getFormId) {
      const formId = element.getFormId();
      const formKey = formId || null; // Convert null to 'null' string
      window.formElements[formKey] = window.formElements[formKey] || {};
      console.debug(`Registering element with id: ${element.id} to form with id: ${formId}`);

      if (window.formElements[formKey][element.id]) {
        // Initialize the form structure if it doesn't exist
        console.warn(
          `Element with id ${element.id} is already registered to form ${formId}. overwriting it.`
        );
      }
      window.formElements[formKey][element.id] = element;
    }
  }

  getFormId() {
    return this.formId;
  }

  render() {
    return this.renderHtml();
  }

  // This method should be implemented by subclasses
  renderHtml() {
    throw new Error("renderHtml() method must be implemented by subclasses");
  }

  getValue() {
    throw new Error("getValue() method must be implemented by subclasses");
  }

  setValue() {
    throw new Error("setValue() method must be implemented by subclasses");
  }

  reset() {
    throw new Error("reset() method must be implemented by subclasses");
  }

  clone(id) {
    return new this.constructor({
      id,
      label: this.label,
      name: this.name,
      value: this.value,
      options: this.options,
    });
  }
}

class BasePrimitiveElement extends BaseElement {
  #dom = null;

  constructor({ id, label, name, value, options = {} }) {
    super({ id, label, name, value, options });

    this.formId = options.formId || this.getFormId(); // Form ID for the element

    // Common options that both text and object elements use
    this.required = options.required || ""; // Whether the element is required
    this.helpText = options.helpText || ""; // Optional help text
    this.placeholder = options.placeholder || ""; // Placeholder text
    this.disabled = options.disabled || ""; // Whether the element is disabled
    this.readonly = options.readonly || ""; // Whether the element is read-only

    this.isPrimitive = true; // Indicates if the element is a primitive form element
  }

  #getElementDom() {
    if (this.#dom) {
      return this.#dom;
    }

    this.#dom = document.getElementById(this.id);
    if (!this.#dom) {
      throw new Error(
        `DOM element with id ${this.id} not found. Element should be rendered first.`
      );
    }

    return this.#dom;
  }

  setValue(value) {
    this.value = value; // Update the internal value

    try {
      const element = this.#getElementDom();
      if (element) {
        element.value = value;
      }
    } catch (error) {
      console.warn(`Element with id ${this.id} not found in the DOM.`);
    }
  }

  getValue() {
    try {
      const element = this.#getElementDom();
      if (element) {
        return element.value;
      }
    } catch (error) {
      console.warn(`Element with id ${this.id} not found in the DOM.`);
      return null;
    }
    return null;
  }

  reset() {
    try {
      const element = this.#getElementDom();
      if (element) {
        element.value = this.originalValue; // Reset to the original value
      }
    } catch (error) {
      console.warn(`Element with id ${this.id} not found in the DOM.`);
    }
  }
}

export { BaseElement, BasePrimitiveElement };
