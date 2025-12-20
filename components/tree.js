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
        // Initial render: Root has no parent ID, so we pass empty string or unique root prefix
        this.upsert(this.tree, this.objects, "", false, "root");

        // Global listener for collapse events within this tree to track state
        this.tree.addEventListener('shown.bs.collapse', (e) => {
            e.stopPropagation(); // Prevent bubbling if nested
            // The target ID is likely "some-id-collapse", we want the node ID
            // Based on template: id="${id}-collapse" -> Node ID is ${id}
            const nodeId = e.target.id.replace('-collapse', '');
            this.trackOpened(nodeId, true);
        });

        this.tree.addEventListener('hidden.bs.collapse', (e) => {
            e.stopPropagation();
            const nodeId = e.target.id.replace('-collapse', '');
            this.trackOpened(nodeId, false);
        });

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

    /**
     * @param {HTMLElement} parent 
     * @param {Array} children 
     * @param {string} path - Data path for utility access
     * @param {boolean} update 
     * @param {string} parentPathId - The deterministic ID of the parent node to ensure stable children IDs
     */
    upsert(parent, children, path = "", update = false, parentPathId = "root") {
        let count = 0;
        children.forEach(object => {

            let dataPath = path == "" ? `${count}` : `${path}.${count}`;

            // Generate stable ID based on parent path and object name (or index if name missing)
            // Sanitize name to be safe for HTML IDs
            const safeName = (object.name || `node_${count}`).replace(/[^a-zA-Z0-9-_]/g, '-');
            const stableId = `${parentPathId}-${safeName}`;

            // Store it on object non-enumerably or just use it? 
            // The plan said not to rely on object._id from data, but we can store our stableId there for runtime use if we want,
            // but the template generation needs to be deterministic.
            // Let's pass stableId to getTemplate.

            // We check if this node was previously opened
            const isExpanded = this.openedNodes[stableId];

            animateExpandedCollapse(parent, () => {
                let template = this.getTemplate(object, dataPath, stableId, isExpanded);
                parent.insertAdjacentHTML('beforeend', template);
            });

            const collapseContainerKey = `#${stableId} .children`;
            const collapseContainer = parent.querySelector(collapseContainerKey);
            const childNode = parent.querySelector(`#${stableId}`); // this childNode becomes the parent for next level

            // Fix: Directly call the function or bind it properly. 
            // Since we can't easily pass arguments to the event listener if we use .bind within arrow, 
            // we'll just wrapper it.
            collapseContainer.addEventListener('show.bs.collapse', () => {
                this.upsertChild(childNode, object, update, stableId);
            });

            // If it should be expanded, we might need to trigger load now if not already loaded
            if (isExpanded) {
                this.upsertChild(childNode, object, update, stableId);
            }

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

    upsertChild(parent, object, update = false, parentPathId) {
        // If parentPathId isn't passed (from legacy calls/events), try to derive or require it.
        // In our fixed event listener, we pass it.
        if (!parentPathId) {
            // Fallback: This shouldn't happen with new code, but safety check.
            parentPathId = parent.id;
        }

        const childCollapseContainerKey = `#${parent.id} .children`;
        const childCollapseContainer = parent.querySelector(childCollapseContainerKey);

        if (!childCollapseContainer) return;

        if (update) {
            // Force update logic
        } else {
            // Avoid re-loading already loaded containers when expand/collapse happens
            if (this.visited.has(childCollapseContainer.id)) {
                return;
            }
        }
        this.loadChild(childCollapseContainer, object, parentPathId);
        this.visited.add(childCollapseContainer.id);
    }

    loadChild(childContainer, object, parentPathId) {
        const uri = childContainer.dataset.uri;
        let data = Utility.deepValue(this.objects, uri);
        if (this.cb && data === undefined) {
            data = this.cb(object);
            data = Utility.deepValue(this.objects, uri, data);
        }

        // this child becomes the parent for next level
        this.upsert(childContainer, data, uri, false, parentPathId);
    }

    getTemplate(object, dataPath, id, isExpanded) {
        const pathToChildren = `${dataPath}.children`;
        // Use the passed stable ID

        // object._id = id; // Do not mutate object ID if user says it comes from API
        // If we really need to store it for some other component logic, we can, but user specifically asked to avoid relying on it for collision reasons.
        // We will just use the DOM ID.

        const name = object.name;
        const expandedClass = isExpanded ? "show" : "";
        const buttonCollapsedClass = isExpanded ? "" : "collapsed";
        const ariaExpanded = isExpanded ? "true" : "false";

        return `
        <ul class="btn-toggle-nav list-unstyled fw-normal small m-0 context-menu-container" id="${id}" data-uri="${dataPath}">
            <li class="ms-3" id="${id}-item"> 
                <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 ${buttonCollapsedClass}" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#${id}-collapse" 
                        aria-expanded="${ariaExpanded}">
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
                    class="collapse children ${expandedClass}" 
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

        // update needs current path ID
        const currentPathId = node.id;
        this.upsertChild(node, this.objects, true, currentPathId);
    }

    refresh(node, data) {
        if (!node || !data) return;

        const childCollapseContainerKey = `#${node.id} .children`;
        const childCollapseContainer = node.querySelector(childCollapseContainerKey);

        // Important: we need the ID of the node being refreshed to maintain stability for its children
        const currentPathId = node.id;

        const uri = childCollapseContainer.dataset.uri;
        Utility.deleteValue(this.objects, uri);
        let obj = Utility.deepValue(this.objects, uri, data);

        animateExpandedCollapse(childCollapseContainer, () => {
            childCollapseContainer.innerHTML = ""
        })

        // This is tricky: refresh usually implies reloading children.
        // We need to clear visited state for this container's children if we are nuking them?
        // Actually animateExpandedCollapse nukes innerHTML so yes, we just re-upsert.

        // We must remove visited status for THIS container so upsertChild won't bail
        this.visited.delete(childCollapseContainer.id);

        this.upsertChild(node, this.objects, true, currentPathId);
    }

    remove(node) {
        if (!node) return;

        // Clean up opened state for this node and children?
        // Since IDs are path based, if we remove it, the ID is gone.
        // But we should probably clean up openedNodes garbage if possible.
        // For now, simpler to just let it be or delete just this one.
        delete this.openedNodes[node.id];

        Utility.deleteValue(this.objects, node.dataset.uri);
        node.remove();
    }
}

export default Tree;
