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
        this.add(this.tree, this.objects);

        // Setup context menu and wire it to emit structured events.
        let contextMenuContainer = this.element.querySelector('#contextMenuContainer');
        this.contextMenu = new ContextMenu({
            name: 'Folder Menu',
            options: {
                maxHeight: '15em'
            }
        });
        this.contextMenu.renderInto(contextMenuContainer);
        this.contextMenu.setDropdownItems(this.contextMenuData);

        // When an item in the context menu is clicked, emit a `context:item` event
        // with structured payload so external handlers can call tree methods like
        // `addChildById` or `refreshById`.
        this.contextMenu.on('item:click', (item) => {
            const target = this.contextMenu.currentTarget || null;
            const uri = target?.dataset?.uri || null;
            const nodeData = uri ? Utility.deepValue(this.objects, uri) : null;
            this.emit('context:item', { item, target, uri, nodeData, tree: this });
        });

        // Capture right-clicks inside the tree; store the clicked node on the context menu
        // so callbacks can reference it.
        this.tree.addEventListener('contextmenu', e => {
            const el = e.target.closest('.context-menu-container');
            if (el) {
                this.contextMenu.currentTarget = el;
            } else {
                this.contextMenu.currentTarget = null;
            }
            this.contextMenu.show(e);
        });
    }

    add(parent, children, path = "") {
        let count = 0;
        children.forEach(object => {
            let dataPath = path == "" ? `${count}` : `${path}.${count}`;
            let template = this.getChildTemplate(object.id, object.name, dataPath);
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
            count++;
        });        
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
    update(node) {
        let data = Utility.deepValue(this.objects, node.dataset.uri);

    }

    /* Public API helpers */
    getObjectByUri(uri) {
        return Utility.deepValue(this.objects, uri);
    }

    getElementById(id) {
        return this.tree.querySelector(`#${id}`);
    }

    getCollapseById(id) {
        return this.tree.querySelector(`#${id} #${id}-collapse`);
    }

    // Add a new child object to a parent identified by its element id
    addChildById(parentId, childObj) {
        const parentEl = this.getElementById(parentId);
        if (!parentEl) throw new Error(`Parent element ${parentId} not found`);
        const dataPath = parentEl.dataset.uri;
        const childrenUri = `${dataPath}.children`;
        const childrenArr = Utility.deepValue(this.objects, childrenUri, []);
        childrenArr.push(childObj);
        // If parent is already expanded/visited, refresh its DOM
        this.refreshById(parentId);
    }

    addChildByUri(childrenUri, childObj) {
        const childrenArr = Utility.deepValue(this.objects, childrenUri, []);
        childrenArr.push(childObj);
        // find element for uri (its parent id is the uri without .children)
        const parentDataPath = childrenUri.replace(/\.children$/, '');
        const parentEl = this.tree.querySelector(`[data-uri="${parentDataPath}"]`);
        if (parentEl) this.refreshById(parentEl.id);
    }

    // Refresh children for a parent element (by id)
    refreshById(parentId) {
        const parentEl = this.getElementById(parentId);
        if (!parentEl) return;
        const dataPath = parentEl.dataset.uri;
        const childrenUri = `${dataPath}.children`;
        const collapseEl = this.getCollapseById(parentId);
        const collapseKey = `#${parentId} #${parentId}-collapse`;
        if (collapseEl) {
            collapseEl.innerHTML = '';
            // remove visited marker so add() will attach events again
            this.visited.delete(collapseKey);
            const childrenArr = Utility.deepValue(this.objects, childrenUri, []);
            if (childrenArr && childrenArr.length) {
                this.add(collapseEl, childrenArr, childrenUri);
                this.visited.add(collapseKey);
            }
        }
    }

    // Add a root-level node
    addNode(nodeObj) {
        this.objects.push(nodeObj);
        // render into DOM if top-level already rendered
        if (this.tree) {
            // compute path for appended node
            const index = this.objects.length - 1;
            const dataPath = `${index}`;
            const template = this.getChildTemplate(nodeObj.id, nodeObj.name, dataPath);
            this.tree.insertAdjacentHTML('beforeend', template);
        }
    }
}

export default Tree;
