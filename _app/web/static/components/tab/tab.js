/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class TabContainer {
  constructor({ id, name, options = {} }) {
    if (!id || !name) {
      throw new Error("SideNav requires an id, name, items array, and containerId");
    }

    this.id = id;
    this.name = name;

    this.options = options || {};
    this.classNames = options.classNames || "";
    this.style = options.style || "";

    this.tabTitleClassNames = options.tabTitle?.classNames || "";
    this.tabTitleStyle = options.tabTitle?.style || "";

    this.element = null;

    this._tabNav = [];
    this._tabContent = [];

    this.navContainer = null;
    this.tabContentContainer = null;
    this.isRendered = false;
  }

  render() {
    this.isRendered = true;
    return this.renderHtml();
  }

  add(tabId, tabName, content, active = false) {
    const tabNav = `
            <li class="nav-item" role="presentation">
                <button class="nav-link rounded-0 ${active ? "active" : ""} ${this.tabTitleClassNames}" 
                    style="${this.tabTitleStyle}"
                    id="${tabId}-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#${tabId}-pane" 
                    type="button" 
                    role="tab" 
                    aria-controls="${tabId}-pane" 
                    aria-selected="false">
                        ${tabName}
                </button>
            </li>`;
    const tabContent = `
            <div class="tab-pane fade ${active ? "active show" : ""}" 
                id="${tabId}-pane" 
                role="tabpanel" 
                aria-labelledby="${tabId}-tab" 
                tabindex="0">
                ${content ? content.renderHtml() : ""}
            </div>`;

    this._tabNav.push(tabNav);
    this._tabContent.push(tabContent);

    if (this.isRendered) {
      const navContainer = document.querySelector(`#${this.id} #${this.id}-nav`);
      const tabContentContainer = document.querySelector(`#${this.id} #${this.id}-content`);
      if (navContainer && tabContentContainer) {
        navContainer.insertAdjacentHTML("beforeend", tabNav);
        tabContentContainer.insertAdjacentHTML("beforeend", tabContent);
      }
    }
  }

  renderHtml() {
    return `
            <div class="tab-container card-body p-0 border-top-0" 
                id="${this.id}">
                <ul class="nav nav-tabs border-top-0 ${this.classNames}" 
                    id="${this.id}-nav" role="tablist">
                        ${this._renderNavItems()}
                </ul>
                <div class="tab-content ${this.classNames}" 
                    style="${this.style}"
                    id="${this.id}-content">
                        ${this._renderTabContent()}
                </div>
            </div>`;
  }

  _renderNavItems() {
    return this._tabNav.join("");
  }

  _renderTabContent() {
    return this._tabContent.join("");
  }
}

export default TabContainer;
