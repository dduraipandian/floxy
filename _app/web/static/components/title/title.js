/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class TitleContainer {
    constructor({ id, name, collapsible = true, options = {}}) {
        this.id = id;
        this.name = name;
        this.collapsible = collapsible;
        this.actions = options.actions || "";
        this.classNames = options.classNames || "";
        this.style = options.style || "";
        this.innerHTML = ""        

        this.containerId = `${this.id}-container`;
    }

    getId() {
        return this.containerId;
    }

    render() {
        return this.renderHtml()
    }

    renderHtml() {
        return this.innerHTML
    }

    add(element) {
        let collapseId = "";
        let collapseIconElement = "";

        if (this.collapsible) {
            collapseId = `${this.id}-form-collapse`;
            collapseIconElement = `<i class="bi bi-arrows-collapse"></i>`;
        }

        const innerHTML = element.renderHtml();

        this.innerHTML = `
        <div class="app-container ${this.classNames}" id="${this.containerId}" 
            ${this.style ? `style="${this.style}"`: ""}>
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="ps-2 text-capitalize fw-bold clickable"                            
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#${this.id}-form-collapse" 
                            aria-expanded="false" 
                            aria-controls="${this.id}-form-collapse">                
                        ${collapseIconElement}
                        ${this.name}
                    </span>
                    ${this.actions}
                </div>
                <div class="collapse show app-container-content card-body p-0" id="${collapseId}">
                    ${innerHTML}
                </div>            
            </div>   
        </div>`;
    }    
}

export default TitleContainer;