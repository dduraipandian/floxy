import { EmitterComponent } from "./base.js"
import Utility from "./utils.js"
import ContextMenu from './contextmenu.js';

class Tree extends EmitterComponent {
    constructor({ name, objects = [], options = {} }) {
        super({ name });
        this.options = options || {};
        this.objects = objects || [];
        this.element = null;
        this.tree = null;
        this.visited = new Set();
        this.cb = options.data_callback || null;
        this.contextMenu = null;
    }

    html() {
        return `
            <div class="tree">
            </div>
            <div id="contextMenuContainer">
            </div>
        `;
    }

    init() {
        this.element = this.container;
        this.tree = this.element.querySelector('.tree');
        this.add(this.tree, this.objects);
        // this.dropDownButton = this.element.querySelector('#contextDropdownBtn');
        // this.dropdown = new bootstrap.Dropdown(this.dropDownButton, {
        //     popperConfig: null   // 🔴 hard-disable Popper
        // });

        // // Hide on click elsewhere
        // document.addEventListener("click", () => {
        //     this.dropdown.hide();
        // });
        // this.contextMenu = this.element.querySelector('#contextDropdownMenu');
        let contextMenuContainer = this.element.querySelector('#contextMenuContainer');
        this.contextMenu = new ContextMenu({
            name: 'Folder Menu',
            options: {
                maxHeight: '15em'
            }
        });
        this.contextMenu.renderInto(contextMenuContainer);
        this.contextMenu.setDropdownItems([
            { name: 'Alpha', value: 'A' },
            { name: 'Bravo', value: 'B' },
            { name: 'Charlie', value: 'C' },
            { name: ""},
            { name: 'Delta', value: 'D' }
        ]);
    }

    add(parent, children, path = "") {
        let count = 0;
        children.forEach(object => {
            let pathToChildren = path == "" ? `${count}.children` : `${path}.${count}.children`;
            let template = this.getChildTemplate(object.id, object.name, pathToChildren);
            parent.insertAdjacentHTML('beforeend', template);

            const collapseContainerKey = `#${object.id} #${object.id}-collapse`
            const collapseContainer = parent.querySelector(collapseContainerKey);
            collapseContainer.addEventListener('show.bs.collapse', () => {
                if (this.visited.has(collapseContainerKey)) {
                    return;
                }

                const uri = collapseContainer.dataset.uri;
                const source = collapseContainer.dataset.source;
                let children1 = Utility.deepValue(this.objects, uri);
                if (this.cb && children1 === undefined) {
                    children1 = this.cb(object);
                    children1 = Utility.deepValue(this.objects, uri, children1);
                }
                this.add(collapseContainer, children1, uri);
                this.visited.add(collapseContainerKey);
            });
            collapseContainer.addEventListener('contextmenu', e => {
                this.contextMenu.show(e);
            });
            count++;
        });
    }

    getChildTemplate(id, name, pathToChildren) {
        return `
        <ul class="btn-toggle-nav list-unstyled fw-normal small m-0" id="${id}">
            <li class="ms-3" id="${id}-item"> 
                <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#${id}-collapse" 
                        aria-expanded="false">
                    <span class="span-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                            id="${id}-icon" 
                            width="16" 
                            height="16"                        
                            class="bi bi-folder-fill" 
                            viewBox="0 0 16 16">
                                <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12q.322-.119.684-.12h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z"></path>
                        </svg>
                        <span id="${id}-spinner"
                            class="spinner-border spinner-border-sm d-none" 
                            role="status"></span>
                        ${name} 
                        <span id="${id}-size" class="badge bg-secondary" style="top: 0" ></span>
                    </span>
                </button>
                <div id="${id}-collapse" 
                    class="collapse children" 
                    data-source="json" 
                    data-uri="${pathToChildren}">
                </div>                
            </li>
        </ul>
        `
    }
}

export default Tree;
