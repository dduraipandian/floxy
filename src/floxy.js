import { EmitterComponent } from "@uiframe/core";

class Floxy extends EmitterComponent {
    constructor({ name, flow, nodePanel, options = {} }) {
        super({ name: name });
        this.name = name;
        this.flow = flow;
        this.nodePanel = nodePanel;
        this.options = options;
    }
    html() {
        return `
            <div id="sidebar"></div>
                <div id="flow-wrapper"></div>
        `;
    }
    init() {
        this.parentContainer.classList.add("floxy");
        this.nodePanelEl = this.container.querySelector("#sidebar");
        this.flowEl = this.container.querySelector("#flow-wrapper");

        this.nodePanel.renderInto(this.nodePanelEl);
        this.flow.renderInto(this.flowEl);
    }
}

export { Floxy };