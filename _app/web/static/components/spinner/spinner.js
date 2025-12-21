/**
 * SideNav - Bootstrap-styled collapsible side navigation component
 * Provides navigation menu with localStorage persistence and custom events
 */

class Spinner {
  constructor({ id, containerId, options = {} }) {
    this.id = id;
    this.containerId = containerId;

    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id ${containerId} not found`);
    }
    this.options = options;
    this.element = null;

    this.spinnerTextId = `${this.id}-spinner-text`;
    this.cancelEventId = `spinner:${this.id}:cancel`;
    this.loadingText = options.loadingText || "Loading";
    this.intervalId = null;
  }

  render() {
    const innerHTML = this.renderHTML();
    this.element = document.createElement("div");
    this.element.style.position = "absolute";
    this.element.style.display = "none"; // Initially hidden
    this.element.style.top = "47%";
    this.element.style.left = "47%";
    this.element.insertAdjacentHTML("beforeend", innerHTML);
    this.container.appendChild(this.element);
    // this._attachEventListeners();
  }

  renderHTML() {
    let progressHTML = "";
    if (this.loadingText) {
      progressHTML = `<span id="${this.spinnerTextId}" 
                                class="text-white mt-3"
                                style="min-width: 100px">${this.loadingText}</span>`;
    }

    return `
            <div id="${this.id}-container"
                class="rounded"
                style="position: absolute; 
                        pointer-events: visible !important;
                        box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;">
                    <div id="${this.id}-spinner"                         
                        class="d-flex flex-column align-items-center justify-content-center">
                    <div class="spinner-border" 
                        style="position: relative; left: -10px !important;"
                        role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    ${progressHTML}
                    </div>
            </div>`;
  }

  _attachEventListeners() {
    // Attach any necessary event listeners here
    // For example, you might want to handle the cancel button click
    const cancelButton = this.element.querySelector(`#${this.cancelId}`);
    if (cancelButton) {
      cancelButton.addEventListener("click", this.#cancel.bind(this));
    }
  }

  #cancel() {
    // Implement the logic to handle cancellation
    this.hide();
    console.log(`Cancellation requested for spinner with id: ${this.id}`);
    const customEvent = new CustomEvent(this.cancelEventId, {
      detail: {
        id: this.id,
        topic: this.topic,
      },
      bubbles: true,
    });
    this.element.dispatchEvent(customEvent);
  }

  show(loadingText = null) {
    loadingText = loadingText || this.loadingText;

    this.element.style.display = "block";
    const containerClasses = this.container.classList;
    if (!containerClasses.contains("disabled")) {
      containerClasses.add("disabled");
    }
    this.setLoadingProgress(loadingText);
  }

  setLoadingProgress(loadingText) {
    this.count = 1;
    let originalText = loadingText;
    const loadingTextElement = this.element.querySelector(`#${this.spinnerTextId}`);
    if (loadingTextElement) {
      loadingTextElement.textContent = loadingText;
      this.intervalId = setInterval(() => {
        loadingText += ".";
        this.count = (this.count % 4) + 1; // Cycle through 1 to 3 dots
        loadingTextElement.textContent = loadingText;
        if (this.count == 1) loadingText = originalText;
      }, 500);
    }
  }

  hide() {
    this.element.style.display = "none";
    const containerClasses = this.container.classList;
    if (containerClasses.contains("disabled")) {
      containerClasses.remove("disabled");
    }
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

export default Spinner;
