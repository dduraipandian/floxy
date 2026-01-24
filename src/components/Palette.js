import { EmitterComponent } from "@uiframe/core";
import { NodeModel } from "./node/NodeModel.js";
import { nodeViewRegistry } from "./node/NodeViewRegistry.js";

class Palette extends EmitterComponent {
    constructor({ items = [], nodeManager }) {
        super({ name: "palette" });
        this.items = items;
        this.nodeManager = nodeManager;
        this.container = null;
    }

    render(containerId) {
        this.container = typeof containerId === "string"
            ? document.getElementById(containerId)
            : containerId;

        if (!this.container) {
            this.container = typeof containerId === "string" ? null : containerId;
            if (!this.container && typeof containerId === "string") {
                // Maybe it's not in DOM yet?
                // Just return or throw?
                // throw new Error("Palette container not found: " + containerId);
            }
        }

        if (this.container) {
            this.container.innerHTML = "";
            this.renderItems();
        }
    }

    renderItems() {
        this.items.forEach((itemData) => {
            this.createPaletteItem(itemData);
        });
    }

    createPaletteItem(itemData) {
        const itemContainer = document.createElement("div");
        itemContainer.className = "draggable-item";
        itemContainer.draggable = true;
        itemContainer.style.position = "relative";
        itemContainer.style.marginBottom = "10px";

        // Data attributes for drag
        itemContainer.dataset.flowModule = itemData.module || "default";
        itemContainer.dataset.flowGroup = itemData.group || "default";
        itemContainer.dataset.flowName = itemData.name || "default";
        itemContainer.dataset.flowLabel = itemData.label || "Node";

        // Bind drag start
        itemContainer.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("module", itemContainer.dataset.flowModule);
            e.dataTransfer.setData("group", itemContainer.dataset.flowGroup);
            e.dataTransfer.setData("name", itemContainer.dataset.flowName);
            e.dataTransfer.setData("label", itemContainer.dataset.flowLabel);
        });

        // Create a dummy model for visualization
        const model = new NodeModel({
            id: `palette-${itemData.name}`,
            ...itemData,
            x: 0,
            y: 0,
            w: 200,
            h: 50
        });

        // Get the view class - FIXED: Pass 3 arguments
        const ViewClass = nodeViewRegistry.get(model.module, model.group, model.name) || nodeViewRegistry.get("default", "default", "default");

        if (ViewClass) {
            // Instantiate View with isPalette option
            const view = new ViewClass(model, { isPalette: true });
            view.init();

            itemContainer.appendChild(view.el);
        } else {
            itemContainer.textContent = itemData.label;
        }

        this.container.appendChild(itemContainer);
    }
}

export { Palette };
