import { EmitterComponent } from "@uiframe/core";
import { nodeViewRegistry } from "./components/node/NodeViewRegistry.js";

class NodePanel extends EmitterComponent {
    constructor({ name, nodeRegistry = nodeViewRegistry, options = {} }) {
        super({ name: name });
        this.nodeRegistry = nodeRegistry;
        this.options = options;
    }

    html() {
        return `<h5>Flow Blocks</h5>
            <p class="text-muted small">Drag blocks to canvas</p>`
    }

    init() {
        const nodes = this.nodeRegistry.values();
        nodes.forEach((node) => {
            const modelDefaults = node.modelDefaults || null;
            const group = modelDefaults.group || null;
            const module = modelDefaults.module || null;
            const name = modelDefaults.name || null;
            if (!modelDefaults) return;
            this.createNodeItem(module, group, name, modelDefaults);
        });
    }

    createNodeItem(module, group, name, modelDefaults) {
        const itemContainer = document.createElement("div");
        itemContainer.className = "draggable-item";
        itemContainer.draggable = true;
        itemContainer.style.position = "relative";
        itemContainer.style.marginBottom = "10px";

        // Data attributes for drag
        itemContainer.dataset.flowModule = module;
        itemContainer.dataset.flowGroup = group;
        itemContainer.dataset.flowName = name;
        itemContainer.dataset.flowLabel = modelDefaults.label || "Node";

        // Bind drag start
        itemContainer.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("module", itemContainer.dataset.flowModule);
            e.dataTransfer.setData("group", itemContainer.dataset.flowGroup);
            e.dataTransfer.setData("name", itemContainer.dataset.flowName);
            e.dataTransfer.setData("label", itemContainer.dataset.flowLabel);
        });

        itemContainer.innerHTML = `
            <div class="node-label">${itemContainer.dataset.flowLabel}</div>
        `;

        this.container.appendChild(itemContainer);
    }
}

export { NodePanel };
