/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class SideNav {
  constructor({ id, name, cb, containerId, items, options = {} }) {
    if (!id || !name || !items || !containerId) {
      throw new Error("SideNav requires an id, name, items array, and containerId");
    }

    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    this.id = id;
    this.name = name;
    this.items = items;

    this.defaultState = options.defaultState || "hidden";
    this.storageKey = options.storageKey || "side-nav-state";
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    this.href = options.href || "";

    this.navItemId = `${this.id}-nav`;
    this.navTabContentId = `${this.id}-tab-content`;
    this.navTabContentContainer = null;

    this.element = null;

    this.callback =
      cb ||
      ((event) => {
        return "";
      });

    // Initialize state from localStorage or default
    this._loadState();
  }

  /**
   * Load navigation state from localStorage
   */
  _loadState() {
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (savedState) {
        this.isVisible = savedState === "visible";
      } else {
        this.isVisible = this.defaultState === "visible";
      }
    } catch (error) {
      console.warn("Could not load navigation state from localStorage:", error);
      this.isVisible = this.defaultState === "visible";
    }
  }

  /**
   * Save navigation state to localStorage
   */
  _saveState() {
    try {
      localStorage.setItem(this.storageKey, this.isVisible ? "visible" : "hidden");
    } catch (error) {
      console.warn("Could not save navigation state to localStorage:", error);
    }
  }

  render() {
    const innerHTML = this.renderHTML();
    this.element = document.createElement("div");
    this.element.insertAdjacentHTML("beforeend", innerHTML);
    this.container.appendChild(this.element);
    this.navTabContentContainer = this.container.querySelector(`#${this.navTabContentId}`);
    this._attachEventListeners();
  }

  renderHTML() {
    const navItemsListHtml = this._renderNavItems();
    const navTabsListHtml = this._renderNavTabs();
    return `
            <div class="row">
                <div id="${this.id}" class="ui-nav pe-0">
                    <div 
                        id="${this.navItemId}" 
                        class="d-flex flex-column flex-shrink-0 scrollbar"
                        style="height: 100vh;">
                        <div class="nav-header ps-3 pt-3">
                            <a href="${this.href}"
                                class="nav-header-title">
                                <span>${this.name}</span> 
                            </a>                                                             
                        </div>
                        <hr />
                        <div class="scroller-nav">
                            <ul class="nav nav-pills flex-column" role="tablist">
                                ${navItemsListHtml}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="ui-nav-content scrollbar px-3 py-1">
                    <div class="tab-content" id="${this.navTabContentId}">
                        ${navTabsListHtml}
                    </div>
                </div>
            </div>`;
  }

  /**
   * Render navigation items
   */
  _renderNavItems() {
    let navItemList = "";

    Object.keys(this.items).forEach((itemId) => {
      const item = this.items[itemId];
      const navItemHtml = this._renderNavItem(itemId, item.name);
      navItemList += navItemHtml;
    });

    return navItemList;
  }

  _renderNavItem(navId, navName) {
    return `<li class="nav-item" role="presentation">
                    <button 
                        class="nav-link w-100 text-start rounded-0" 
                        data-bs-toggle="tab" 
                        type="button" 
                        role="tab" 
                        aria-selected="false" 
                        id="${navId}-tab"     
                        data-app-nav-id="${navId}"                                         
                        data-bs-target="#${navId}-tab-pane"                         
                        aria-controls="${navId}-tab-pane">${navName}
                    </button>        
                </li>`;
  }

  _renderNavTabs() {
    let navTabList = "";

    Object.keys(this.items).forEach((itemId) => {
      const item = this.items[itemId];
      const navTabHtml = this._renderNavTab(itemId, item.name);
      navTabList += navTabHtml;
    });

    return navTabList;
  }

  _getNavTabPaneContentId(navId) {
    return `${navId}-tab-pane-content`;
  }

  _renderNavTab(navId) {
    const wh = window.innerHeight;
    return `<div class="tab-pane fade scrollbar" 
                    id="${navId}-tab-pane" 
                    role="tabpanel"
                    aria-labelledby="${navId}-tab" 
                    tabindex="0">
                    <div id="${this._getNavTabPaneContentId(navId)}">
                            <!-- tab-content-container -->
                        </div>
                </div>`;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    const navList = this.container.querySelector(`#${this.id} ul`);
    navList.addEventListener("click", (e) => {
      e.preventDefault();
      const navId = e.target.closest("button[data-app-nav-id]").dataset.appNavId;
      if (navId) {
        this.navItemOnClick(navId);
      }
    });
  }

  navItemOnClick(navId) {
    const eventData = {
      id: navId,
      ...this.items[navId],
    };
    console.log("Nav item clicked!", navId); // `this` refers to the class instance

    this.callback(eventData).then(([tabContainer, cb, visited]) => {
      if (visited) {
        return;
      }
      console.debug(`Rendering tab container for nav item: ${navId}`, tabContainer);
      const navTabPaneContentId = this._getNavTabPaneContentId(navId);
      const navTabContentContainer = this.container.querySelector(`#${navTabPaneContentId}`);
      navTabContentContainer.insertAdjacentHTML("beforeend", tabContainer.renderHtml());
      cb();
    });

    // const customEvent = new CustomEvent('nav:select', {
    //     detail: eventData,
    //     bubbles: true,
    // });
    // this.container.dispatchEvent(customEvent);
  }

  /**
   * Show the navigation
   */
  show() {
    this.isVisible = true;
    this._updateVisibility();
    this._saveState();
  }

  /**
   * Hide the navigation
   */
  hide() {
    this.isVisible = false;
    this._updateVisibility();
    this._saveState();
  }

  /**
   * Toggle navigation visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update DOM to reflect visibility state
   */
  _updateVisibility() {
    if (!this.element) return;

    const nav = this.element.querySelector("nav");
    this.toggleButton.setAttribute("aria-expanded", this.isVisible.toString());

    if (this.isVisible) {
      nav.classList.remove("d-none");
      nav.classList.add("d-md-block");
    } else {
      nav.classList.add("d-none");
      nav.classList.add("d-md-block");
    }
  }

  /**
   * Update navigation items
   */
  updateItems(items) {
    this.items = items || [];
    if (this.rendered) {
      this._renderNavItems();
    }
  }

  /**
   * Get current navigation state
   */
  getState() {
    return {
      id: this.id,
      isVisible: this.isVisible,
      items: this.items,
    };
  }
}

export default SideNav;
