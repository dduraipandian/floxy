import { BaseElement } from './elements/base.js';
import ColumnElement from './col.js';

class BaseNonPrimitiveElement extends BaseElement {
    constructor({ id, label, name, value, options = {} }) {
        super({ id, label, name, value, options });

        this.uiElements = []; // Array to hold form elements
        this.formElements = []; // Array to hold form elements

        this.isPrimitive = false; // Indicates if the group is a native form element
    }

    addElement(element, propertyConfig = {}) {
        element.isPrimitive ? this.addPrimitiveElement(element, propertyConfig) : this.addNonPrimitiveElement(element, propertyConfig);
        this.formElements.push(element);        
    }

    addPrimitiveElement(element, propertyConfig = {}) {
        const column = new ColumnElement({ element, options: { colPosition: propertyConfig["col-position"] } });
        this.uiElements.push(column); // Add a column instance to the form        
    }

    addNonPrimitiveElement(element, propertyConfig = {}) {
        this.uiElements.push(element); // Add a column instance to the form
    }

    setValue(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided for import.');
        }

        console.debug(`Importing data into form with id: ${this.id}`, data);

        this.formElements.forEach(element => {
            if (element.setValue) {
                const value = data[element.name];
                if (value !== undefined) {
                    element.setValue(value);
                }
            }
        });
    }

    getValue() {
        const data = {};
        this.formElements.forEach(element => {
            if (element.getValue) {
                data[element.name] = element.getValue();
            }
        });
        console.debug(`Exported data from form with id: ${this.id}`, data);
        return data;
    }

    reset() {
        console.debug(`Resetting form with id: ${this.id}`);

        this.formElements.forEach(element => {
            if (element.reset) {
                element.reset();
            }
        });
    }
}

export default BaseNonPrimitiveElement;
