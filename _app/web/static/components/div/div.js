/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class DivContainer {
    constructor({ element = "", id = "", options = {} }) {
        this.id = id;
        this.element = element;
        this.classNames = options.classNames || "";
        this.style = options.style || "";     
        
        this.elementId = `${this.id}-div-container`;
    }

    render() {
        return this.renderHtml()
    }

    getId() {
        return this.elementId
    }

    renderHtml() {
        return `
            <div ${this.id ? `id="${this.elementId}"` : ""}
                class="${this.classNames}" 
                style="${this.style}">
                ${this.element.renderHtml ? this.element.renderHtml(): ""}
            </div>`;
    }
}

export default DivContainer;