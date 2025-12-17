/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class StackLayer {
    constructor({ id, options = {}}) {
        this.id = id;

        this.classNames = options.classNames || "";
        this.style = options.style || "";

        this.innerHTML = ""
        this._elements = [];
    }

    render() {
        return this.renderHtml()
    }    

    renderHtml() {
        const innerHTML = this._elements.map(element => this.addElement(element)).join('');

        return  `
            <div class="${this.classNames}">
                ${innerHTML}
            </div>`;
    }
    
    add(element) {
        if (!element) {
            throw new Error('StackLayer requires a valid element');
        }
        this._elements.push(element);
    }

    addElement(element) {
        return `
            <div class="row">
                <div class="col-12">
                    ${element.renderHtml()}
                </div>
            </div>`;
    }
}

export default StackLayer;