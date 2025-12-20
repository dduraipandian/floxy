import { EmitterComponent } from "./base.js"
import Utility from "./utils.js"
import ContextMenu from './contextmenu.js';


function animateExpandedCollapse(container, mutateFn) {
    // Only animate if this is an expanded collapse
    if (!container.classList.contains('show')) {
        mutateFn();
        return;
    }

    // 1️⃣ Measure before
    const startHeight = container.scrollHeight;

    // 2️⃣ Mutate DOM (add children)
    mutateFn();

    // 3️⃣ Measure after
    const endHeight = container.scrollHeight;

    // 4️⃣ Animate height delta
    container.style.height = startHeight + 'px';
    container.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        container.style.transition = 'height 300ms ease';
        container.style.height = endHeight + 'px';
    });

    container.addEventListener('transitionend', () => {
        container.style.height = '';
        container.style.transition = '';
        container.style.overflow = '';
    }, { once: true });
}

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
        this.openedNodes = {};
    }

    html() {
        return `
            <div class="tree" id="${this.id}-tree">
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
        this.tree.addEventListener('contextmenu', e => {
            this.contextMenu.show(this, e);
        });
    }

    upsert(parent, children, path = "", update = false) {
        let count = 0;
        children.forEach(object => {

            let dataPath = path == "" ? `${count}` : `${path}.${count}`;

            animateExpandedCollapse(parent, () => {
                let template = this.getTemplate(object, dataPath);
                parent.insertAdjacentHTML('beforeend', template);
            });

            const collapseContainerKey = `#${object._id} .children`;
            const collapseContainer = parent.querySelector(collapseContainerKey);
            const childNode = parent.querySelector(`#${object._id}`); // this childNode becomes the parent for next level

            collapseContainer.addEventListener('show.bs.collapse', () => {
                this.upsertChild.bind(this, childNode, object, update)
            });
            count++;
        });
    }
    
    trackOpened(nodeId, isOpen) {
        if (isOpen) {
            this.openedNodes[nodeId] = true;
        } else {
            delete this.openedNodes[nodeId];
        }
    }

    upsertChild(parent, object, update) {
        const childCollapseContainerKey = `#${parent.id} .children`;
        const childCollapseContainer = parent.querySelector(childCollapseContainerKey);

        if (update) {
            if (!childCollapseContainer) {
                console.warn("Mismatched container for update");
                return;
            }
        } else {
            // Avoid re-loading already loaded containers when expand/collapse happens
            if (this.visited.has(childCollapseContainer.id)) {
                return;
            }
        }
        this.loadChild(childCollapseContainer, object);
        this.visited.add(childCollapseContainer.id);
    }

    loadChild(childContainer, object) {
        const uri = childContainer.dataset.uri;
        const source = childContainer.dataset.source;
        let data = Utility.deepValue(this.objects, uri);
        if (this.cb && data === undefined) {
            data = this.cb(object);
            data = Utility.deepValue(this.objects, uri, data);
        }

        // this child becomes the parent for next level
        this.upsert(childContainer, data, uri);
    }

    getTemplate(object, dataPath) {
        const pathToChildren = `${dataPath}.children`;
        const id = object._id || ("dd-" + dataPath + '-' + Math.random().toString(36).substr(2, 9)).replaceAll('.', '-');

        object._id = id;
        const name = object.name
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
        if (!node || !data) return;

        const uri = node.dataset.uri;
        let obj = Utility.deepValue(this.objects, uri);
        obj.children = data;

        this.upsertChild(node, this.objects, true);
    }

    refresh(node, data) {
        if (!node || !data) return;

        const childCollapseContainerKey = `#${node.id} .children`;
        const childCollapseContainer = node.querySelector(childCollapseContainerKey);

        const uri = childCollapseContainer.dataset.uri;
        Utility.deleteValue(this.objects, uri);
        let obj = Utility.deepValue(this.objects, uri, data);

        animateExpandedCollapse(childCollapseContainer, () => {
            childCollapseContainer.innerHTML = ""
        })
        this.upsertChild(node, this.objects, true);
    }

    remove(node) {
        if (!node) return;
        Utility.deleteValue(this.objects, node.dataset.uri);
        node.remove();
    }
}

export default Tree;
