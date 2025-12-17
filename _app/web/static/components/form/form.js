import BaseNonPrimitiveElement from './base.js';

import emitter from '../emitter.js';

import FormElement from './element.js';
// import NumberInputElement from './elements/number.js';
// import ObjectElement from './elements/object.js';
// import DropdownElement from './elements/dropdown.js';
// import CheckboxElement from './elements/checkbox.js';
// import ArrayElement from './elements/array.js';
import Group from './group.js';
import ArrayGroup from './array_group.js';

import * as utils from '../utils.js';


class Form extends BaseNonPrimitiveElement {
  constructor({ id, action, method, name, schema, type = "function", value = {}, options = {} }) {
    if (!name) {
      throw new Error('Name and method are required parameters.');
    }
    super({ id: id, label: name, name, value, options });
    this.action = action; // Form action URL
    this.method = method; // Form method (e.g., 'POST', 'GET')

    this.type = type; // Type of form, e.g., 'function', 'workflow'

    this.submitButtonValue = options.submitButtonValue || "Submit"; // Whether to include a submit button
    this.schema = schema; // Schema for validation or structure    
    this.elementCommonOptions = {
      classNames: "form-control form-control-sm w-100",
    }

    // Store reference to the rendered DOM element
    this.domElement = null;

    // Register this form globally and create elements registry
    if (typeof window !== 'undefined') {
      if (!window.forms) {
        window.forms = {};
      }
      window.forms[this.id] = this;

      if (!window.formElements) {
        window.formElements = {};
      }
      if (!window.formElements[this.id]) {
        window.formElements[this.id] = {};
      }
    }

    console.debug(`Form created with id: ${this.id}, schema:`, this.schema);
  }

  renderHtml() {
    let elementsHTML = ""
    if (!this.schema || !this.schema.properties) {
      console.warn('Schema is empty or invalid, no elements to render.');
    } else {
      const schema = utils.deepCopy(this.schema);
      const required = schema.required || [];
      this.#render(schema.properties, required, parent = this); // Render the form elements based on the schema
      // this.#createElements()
      elementsHTML = this.uiElements.map(element => element.render()).join('\n');
    }

    return `
      <form class="${this.classNames} app-form" 
        id="${this.id}" 
        style="padding: .5rem 1.50rem !important; ${this.style}"
        onsubmit="event.preventDefault(); window.forms['${this.id}'].submit(event)">
        <div class="row">
          ${elementsHTML}
        </div>
        <div class="row mt-1">
          <div class="px-3 col text-center mx-auto">
            <input type="submit" 
              class="btn btn-primary my-3 px-4 fw-bold" 
              style="background-color: #2b62b3 !important; 
                      box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px !important;" 
              value="${this.submitButtonValue}">
          </div>
        </div>
      </form>
    `;
  }

  #render(properties, requiredConfig, parent) {
    if (!properties) {
      console.warn('Properties are empty or invalid, no elements to render.');
      return;
    }

    console.debug(`Rendering form with properties:`, properties, `and required fields:`, requiredConfig);

    const orderedProperties = utils.sortFormElements(utils.object2Array(properties));

    orderedProperties.forEach(propertyConfig => {
      const property = propertyConfig._id || propertyConfig.name;
      const element = this.#handleProperty(property, propertyConfig, requiredConfig, parent);
      if (element) {
        parent.addElement(element, propertyConfig);
      } else {
        console.warn(`No element created for property: ${property}`);
      }
    });
    console.debug(`Ordered properties for rendering:`, parent);
  }

  #handleProperty(property, propertyConfig, requiredConfig, parent) {
    console.debug(`Handling property: ${property}`, propertyConfig, requiredConfig);
    const type = propertyConfig.type;
    let element = null

    switch (type) {
      case 'string':
      case 'integer':
      case 'boolean':
      case 'json':
        element = this.#createElementForProperty(parent.id, property, propertyConfig, requiredConfig);
        console.debug(`Created element for property: ${property}`, element);
        return element;
      case 'object':
        const objectProperties = propertyConfig.properties || {};
        const objectRequired = propertyConfig.required || [];
        let group = new Group({
          id: `g-${this.id}-${propertyConfig._id}`,
          name: property || "Group",
          options: {
            formId: this.id,
            ...propertyConfig
          }
        });
        this.#render(objectProperties, objectRequired, group);
        return group;
      case 'array':
        // Handle array type, which may contain objects or primitive types
        if (propertyConfig.items && propertyConfig.items.type) {
          const itemType = propertyConfig.items.type;
          if (itemType === 'object') {
            const arrayGroup = new ArrayGroup({
              id: `ag-${this.id}-${propertyConfig._id}`,
              name: property || "Array Group",
              options: {
                formId: this.id,
                ...propertyConfig
              }
            });
            this.#render(propertyConfig.items.properties, propertyConfig.items.required || [], arrayGroup);
            return arrayGroup;
          } else {
            // Handle primitive types in arrays
            return this.#createElementForProperty(parent.id, property, propertyConfig, requiredConfig);
          }
        } else {
          console.warn(`Array type without items defined for property: ${property}`);
          return null;
        }
    }
  }

  #createElementForProperty(id, property, propertyConfig, requiredConfig) {
    // Placeholder implementation, update as needed based on your schema
    // For example, you might want to switch on property type
    console.debug(`Creating element for property: ${property}`, propertyConfig, requiredConfig);

    const type = propertyConfig.type;

    var label = propertyConfig["title"] ? propertyConfig["title"] : "";
    var desc = propertyConfig["description"] ? propertyConfig["description"] : "";
    var defaultValue = propertyConfig["default"] ? propertyConfig["default"] : "";
    var helpText = propertyConfig["help-text"] ? propertyConfig["help-text"] : "";

    var required = requiredConfig.includes(property) ? true : false;

    const options = {
      required: required,
      placeholder: desc,
      helpText: helpText
    }

    const ele = new FormElement({
      type: type,
      id: `${id}-${property}`,
      label: label,
      name: property,
      value: defaultValue,
      desc: desc,
      defaultValue: defaultValue,
      options: {
        ...this.elementCommonOptions,
        ...options,
        formId: this.id // Pass the form ID to the element
      }
    });

    return ele.getElement();
  }

  submit(event) {
    console.debug(`Submitting form with id: ${this.id}`);

    const data = this.getValue();
    // Here you can handle the form submission logic, e.g., sending data to a server
    // For now, we just log the data
    console.log('Form submitted with data:', data);
    emitter.emit(`form:${this.id}:submit`, data);
  }
}

export default Form;