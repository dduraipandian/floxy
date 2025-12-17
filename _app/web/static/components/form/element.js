import TextInputElement from './elements/text.js';
import ObjectElement from './elements/object.js';
import IntegerInputElement from './elements/integer.js';
import BooleanInputElement from './elements/boolean.js';

class FormElement {
    constructor({ type, label, name, id, value = '', desc = '', defaultValue = '', options = {} }) {
        this.type = type;
        this.label = label;
        this.name = name;
        this.id = id;
        this.value = value;
        this.desc = desc;
        this.defaultValue = defaultValue;
        this.formId = options.formId; // Extract formId from element ID
        this.classNames = options.classNames || "form-control form-control-sm text-white w-100";

        this.elementOptions = {
            required: options.required || false,
            placeholder: options.placeholder || '',
            helpText: options.helpText || ''
        }
    }

    getElement() {
        switch (this.type) {
            case 'string':
                return this.#getTextElement();
            case 'integer':
                return this.#getIntegerElement();
            case 'boolean':
                return this.#getBooleanElement();
            case 'json':
                return this.#getObjectElement();
            default:
                return null; // or throw an error if the type is unsupported
        }
    }
    #getTextElement() {
        return new TextInputElement({
            id: this.id,
            label: this.label,
            name: this.name,
            value: this.value,
            options: {
                classNames: this.classNames,
                formId: this.formId,
                ...this.elementOptions
            }
        });
    }
    #getObjectElement() {
        return new ObjectElement({
            id: this.id,
            label: this.label,
            name: this.name,
            value: this.value,
            options: {
                classNames: this.classNames,
                formId: this.formId,
                formatJson: true, // Default to true for JSON formatting
                style: "padding-top: 3rem; height: 250px; font-family: monospace;",
                ...this.elementOptions
            }
        });
    }

    #getIntegerElement() {
        return new IntegerInputElement({
            id: this.id,
            label: this.label,
            name: this.name,
            value: this.value,
            options: {
                classNames: this.classNames,
                formId: this.formId,
                ...this.elementOptions
            }
        });
    }

    #getBooleanElement() {
        return new BooleanInputElement({
            id: this.id,
            label: this.label,
            name: this.name,
            value: this.value,
            options: {
                classNames: this.classNames,
                formId: this.formId,
                ...this.elementOptions
            }
        });
    }
}

export default FormElement;