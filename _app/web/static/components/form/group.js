import BaseNonPrimitiveElement from './base.js';


class Group extends BaseNonPrimitiveElement {
    constructor({ id, name, value = {}, options = {} }) {
        if (!id || !name) {
            throw new Error('ID and name are required parameters.');
        }
        super({ id, label: name, name, value, options });

        if (options.collapse?.enabled == undefined) {
            options.collapse = {
                enabled: true,
                show: false
            }; // Default to enabled if not specified
        }
        this.collapse = options.collapse?.enabled ? true : false; // Whether the group is collapsible
        this.show = options.collapse?.show ? "show" : ''; // Inline styles for the form
    }

    renderHtml() {
        const groupedElementsHTML = this.uiElements.map(element => element.render()).join('\n');
        if (this.collapse) {
            return `
            <div class="col-12">
                <div class="p-3 px-1">
                    <div class="row app-form-group pb-2 rounded">
                        <div class="d-inline-flex floating ps-0 pb-2">
                            <span class="group-header ${this.classNames}"
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#${this.id}" 
                                    aria-expanded="false" 
                                    aria-controls="${this.id}">
                                <i class="bi bi-arrows-collapse ms-2 fs-5 float-start"></i>
                                <span class="align-middle float-end mt-1 ms-2"> ${this.name} config</span>
                            </span>
                        </div>
                        <div class="collapse ${this.show} app-input-group scrollbar pb-1" id="${this.id}">
                            <div class="row group-item">
                                <div class="col-12">
                                    <div class="row">
                                        ${groupedElementsHTML}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
        else {
            return `${groupedElementsHTML}`;
        }
    }
}

export default Group;