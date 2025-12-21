/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

import emitter from "../emitter.js";

class DeckLayer {
  constructor({ id, name, options = {} }) {
    this.id = id;
    this.name = name;

    this.classNames = options.classNames || "";
    this.style = options.style || "";

    this.innerHTML = "";
    this._elements = [];
    this._ids = [];

    this.parentId = options.parentId || null;
    this.mainDeck = null;
    this.mainDeckId = null;
  }

  registerEvent(id, event) {
    this._ids.push(id);
    console.log(this._ids);
    emitter.on(event, (data) => {
      console.log("Event received for deck:", id, data);
      const display = data.show == undefined || data.show ? true : false;
      this.show(id, display, data.name);
    });
  }

  show(id, display, name) {
    this.#show(id, display);
    document.querySelector(`#${this.id} .breadcrumb-item.active`).textContent = name;

    this._ids.forEach((elId) => {
      if (elId == id) return;
      this.#show(elId, false);
    });
  }

  #show(id, show) {
    if (show) {
      document.getElementById(id).classList.remove("hide");
      document.getElementById(id).classList.add("active");
    } else {
      document.getElementById(id).classList.remove("active");
      document.getElementById(id).classList.add("hide");
    }
  }

  render() {
    return this.renderHtml();
  }

  loadContainers() {
    this.mainDeck = document.querySelector(`#${this.id} .breadcrumb-item.main a`);
    this.mainDeck.addEventListener("click", this.showMainDeck.bind(this));
  }
  showMainDeck() {
    if (this.parentId) {
      emitter.emit(`deck:${this.parentId}:shown`, () => {});
    }
    this.show(this.mainDeckId, true, "");
  }

  renderHtml() {
    const innerHTML = this._elements
      .map(({ id, element, show, listen }) => this.addElement({ id, element, show, listen }))
      .join("");

    return `            
            <div id="${this.id}" class="deck-container ${this.classNames}">
                <div class="mt-3 ms-2">
                    <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='%236c757d'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item main"><a href="#">${this.name}</a></li>
                            <li class="breadcrumb-item active" aria-current="page"></li>
                        </ol>                        
                    </nav>                 
                </div>
                <div>
                    ${innerHTML}
                </div>
            </div>`;
  }

  #getDeckId(id) {
    return `${id}-deck`;
  }

  add({ id, element, show, listen }) {
    if (show && !this.mainDeckId) {
      this.mainDeckId = this.#getDeckId(id);
    }

    if (!element) {
      throw new Error("StackLayer requires a valid element");
    }
    this._elements.push({ id, element, show, listen });
  }

  addElement({ id, element, show, listen }) {
    console.log(listen);
    const deckId = this.#getDeckId(id);
    this.registerEvent(deckId, listen);
    return `
            <div id="${deckId}" class="${show ? "show" : "hide"}">
                ${element.renderHtml()}
            </div>`;
  }
}

export default DeckLayer;
