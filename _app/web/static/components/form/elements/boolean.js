import {BasePrimitiveElement} from './base.js';

class BooleanInputElement extends BasePrimitiveElement {
    constructor({ id, label, name, value = false, options = {} }) {
        super({ id, label, name, value, options });
    }

    renderHtml() {
        const checked = this.value ? 'checked' : '';

        return `
            <div class="form-group mb-3">
                <div class="form-check">
                    <input 
                        type="checkbox" 
                        class="form-check-input text-white w-100" 
                        id="${this.id}" 
                        name="${this.name}" 
                        ${checked}
                        ${this.required ? 'required' : ''}
                        style="${this.style}"
                        data-type="boolean"
                    />
                    <label for="${this.id}" class="form-check-label text-white fw-bold">${this.label}</label>
                </div>
                ${this.helpText ? `<div id="${this.id}-help" class="form-text ms-1 help-text">${this.helpText}</div>` : ""}
            </div>
        `;
    }

    getValue() {
        try {
            const element = document.getElementById(this.id);
            if (!element) {
                console.warn(`Element with id ${this.id} not found in DOM`);
                return this.value;
            }            
            return element.checked;
        } catch (error) {
            console.error(`Error getting value for ${this.id}:`, error);
            return this.value;
        }
    }

    setValue(value) {
        try {
            // Convert value to boolean
            if (value === null || value === undefined) {
                this.value = false;
            } else if (typeof value === 'string') {
                this.value = value.toLowerCase() === 'true' || value === '1';
            } else {
                this.value = Boolean(value);
            }
            
            const element = document.getElementById(this.id);
            if (element) {
                element.checked = this.value;
            }
        } catch (error) {
            console.error(`Error setting value for ${this.id}:`, error);
        }
    }
}

export default BooleanInputElement;
