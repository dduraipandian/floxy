import { EmitterComponent } from "./base.js"

class Tab extends EmitterComponent {
    constructor({ name, options = {} }) {
        super({ name });

        this.options = options;

        this.tabListId = `${this.containerID}-tab-list`;
        this.tabContentId = `${this.containerID}-tab-content`;

        this.tabs = options.tabs || [];
        this.activeTab = options.activeTab || (this.tabs.length > 0 ? this.tabs[0].id : null);

        this.tabListContainer = null;
        this.tabContentContainer = null;

        this.createContainer();
    }

    html() {
        const tabHeaders = this.tabs.map((tab) => this.newTabListHtml(tab)).join('');

        return `
            <nav class="frame-tab">
                <div class="nav nav-tabs" id="${this.tabListId}" role="tablist">
                    ${tabHeaders}
                </div>
            </nav>
            <div class="tab-content" id="${this.tabContentId}" style="height: calc(100% - 40px); overflow: auto;">
                ${this.tabs.map(tab => this.newTabContentHtml(tab)).join('')}
            </div>
        `;
    }

    init() {
        this.tabListContainer = this.container.querySelector(`#${this.tabListId}`);
        this.tabContentContainer = this.container.querySelector(`#${this.tabContentId}`);

        // Populate initial tabs content
        this.tabs.forEach(tab => {
            const container = this.tabContentContainer.querySelector(`#${tab.id}-content`);
            if (container) {
                this.populateTabContent(tab, container);
            }
        });
    }

    addTab(tab) {
        this.tabs.push(tab);
        const newTabHeaderTemplate = this.newTabListHtml(tab);
        const newTabContentTemplate = this.newTabContentHtml(tab);

        this.tabListContainer.insertAdjacentHTML('beforeend', newTabHeaderTemplate);
        this.tabContentContainer.insertAdjacentHTML('beforeend', newTabContentTemplate);

        const container = this.tabContentContainer.querySelector(`#${tab.id}-content`);
        this.populateTabContent(tab, container);
    }

    populateTabContent(tab, container) {
        if (!container || !tab.content) return;

        if (typeof tab.content === "string") {
            container.innerHTML = tab.content;
        } else if (tab.content instanceof EmitterComponent) {
            const element = tab.content.getContainer();
            container.appendChild(element);
        } else if (tab.content) {
            container.appendChild(tab.content);
        }
    }

    newTabListHtml(tab) {
        const isActive = tab.id === this.activeTab ? 'active' : '';
        return `
                <button class="nav-link ${isActive} rounded-0" 
                    id="${tab.id}-tab" 
                    aria-controls="${tab.id}-content" 
                    role="tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#${tab.id}-content">
                    ${tab.title}
                </button>
            `;
    }

    newTabContentHtml(tab) {
        const isActive = tab.id === this.activeTab ? 'show active' : '';
        return `
            <div class="tab-pane fade ${isActive}" 
                id="${tab.id}-content" 
                style="height: 100%; width: 100%; overflow: auto;"
                role="tabpanel" 
                aria-labelledby="${tab.id}-tab">
            </div>
        `;
    }
}

export default Tab;