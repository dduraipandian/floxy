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
        this.contextMenuData = options.contextData || [];
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
        this.upsert(this.tree, this.objects);
        let contextMenuContainer = this.element.querySelector('#contextMenuContainer');
        this.contextMenu = new ContextMenu({
            name: 'Folder Menu',
            options: {
                maxHeight: '15em'
            }
        });
        this.contextMenu.renderInto(contextMenuContainer);
        this.contextMenu.setDropdownItems(this.contextMenuData);
        // this.contextMenu.on('item:click', (node) => {
        //     node.item.callback(node);
        // });
        this.tree.addEventListener('contextmenu', e => {
            this.contextMenu.show(this, e);
        });
    }

    upsert(parent, children, path = "", update = false) {
        let count = 0;
        children.forEach(object => {
            let dataPath = path == "" ? `${count}` : `${path}.${count}`;
            let template = this.getChildTemplate(object.id, object.name, dataPath);
            parent.insertAdjacentHTML('beforeend', template);

            const collapseContainerKey = `#${object.id} #${object.id}-collapse`;
            const collapseContainer = parent.querySelector(collapseContainerKey);
            collapseContainer.addEventListener('show.bs.collapse', this.upsertChild.bind(this, parent, object, update));
            count++;
        });
    }

    upsertChild(container, object, update) {
        const collapseContainerKey = `#${object.id} #${object.id}-collapse`;
        const collapseContainer = update ? container : container.querySelector(collapseContainerKey);        

        if (update) {
            const collapseContainerId = container.id
            if (collapseContainerId !== `${object.id}-collapse`) {
                console.warn("Mismatched container for update");
                return;
            }
        } else {
            // Avoid re-loading already loaded containers when expand/collapse happens
            if (this.visited.has(collapseContainerKey)) {
                return;
            }
        }
        this.loadChild(collapseContainer, object);
    }

    loadChild(container, object) {
        const collapseContainerKey = `#${object.id} #${object.id}-collapse`
        const uri = container.dataset.uri;
        const source = container.dataset.source;
        let children1 = Utility.deepValue(this.objects, uri);
        if (this.cb && children1 === undefined) {
            children1 = this.cb(object);
            children1 = Utility.deepValue(this.objects, uri, children1);
        }
        this.upsert(container, children1, uri);
        this.visited.add(collapseContainerKey);
    }

    getChildTemplate(id, name, dataPath) {
        const pathToChildren = `${dataPath}.children`;
        return `
        <ul class="btn-toggle-nav list-unstyled fw-normal small m-0 context-menu-container" id="${id}" data-uri="${dataPath}">
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

    update(node, data) {
        console.log("Updating node", node, data);
        if(!node || !data) return;
        
        this.upsertChild(node, data, true);
    }
}

export default Tree;
