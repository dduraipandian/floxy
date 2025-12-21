class Toast {
  constructor() {
    this.INFO = "info";
    this.SUCCESS = "success";
    this.ERROR = "error";
    this.WARNING = "warning";

    this.#getDiv(this.INFO);
    this.#getDiv(this.SUCCESS);
    this.#getDiv(this.ERROR);
    this.#getDiv(this.WARNING);
  }

  #getDiv(level) {
    const div = document.createElement("div");
    div.innerHTML = this.#html(level);
    document.body.appendChild(div);
    return div;
  }

  #errorModal() {
    return `
            <div class="modal fade" id="errorToastModal" 
                data-bs-backdrop="static" 
                data-bs-keyboard="false" 
                tabindex="-1" 
                aria-labelledby="staticBackdropLabel" 
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-white" style="max-width: 650px; width: 650px">
                        <div class="modal-header border-secondary">
                            <h1 class="modal-title fs-5" id="errorToastModalTitle"></h1>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <pre id="errorToastModalMessage"></pre>
                        </div>
                        <div class="modal-footer border-secondary">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  #html(level) {
    let bgClass = "bg-info text-dark";
    let autoHide = true;
    let modalHtml = "";

    if (level === "success") {
      bgClass = "bg-success text-white";
    } else if (level === "error") {
      bgClass = "bg-danger text-white";
      modalHtml = this.#errorModal();
      autoHide = false;
    } else if (level === "warning") {
      bgClass = "bg-warning text-dark";
    }

    return `
            ${modalHtml}
            <div class="toast-container position-fixed bottom-0 end-0 p-3 me-2 mb-3">
                <div id="liveToast-${level}" 
                    class="toast align-items-center ${bgClass}" 
                    role="alert"
                    aria-live="assertive"
                    data-bs-autohide="${autoHide}"
                    aria-atomic="true" 
                    data-bs-delay="3000">
                    <div class="d-flex">
                        <div id="toast-body-${level}" class="toast-body"></div>
                        <button type="button" 
                            class="btn-close me-2 m-auto" 
                            data-bs-dismiss="toast" 
                            aria-label="Close">
                        </button>
                    </div>
                </div>
            </div>`;
  }
  #showToast(message, level = "info") {
    console.debug("Showing toast message:", message);

    let toastElement = document.getElementById(`liveToast-${level}`);
    const toastBody = document.getElementById(`toast-body-${level}`);
    toastBody.innerHTML = message;

    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
    toastBootstrap.show();
  }

  #showErrorModal(title, message) {
    console.error("Showing error modal:", message);
    const modalTitle = document.getElementById("errorToastModalTitle");
    const modalBody = document.getElementById("errorToastModalMessage");

    const toastBody = document.getElementById("toast-body-error");

    toastBody.innerHTML += `
            <span type="button"
                data-bs-toggle="modal"       
                data-bs-target="#errorToastModal"> 
                    <u>show</u>
            </span>`;

    modalTitle.innerHTML = title;
    modalBody.innerHTML = message === "string" ? message : JSON.stringify(message, null, 2);
  }

  error(message, title, details) {
    console.error("Error toast:", message);
    this.#showToast(message, this.ERROR);

    if (title && details) {
      this.#showErrorModal(title, details);
    }
  }

  success(message) {
    console.log("Success toast:", message);
    this.#showToast(message, this.SUCCESS);
  }
  info(message) {
    console.info("Info toast:", message);
    this.#showToast(message, this.INFO);
  }
  warning(message) {
    console.warn("Warning toast:", message);
    this.#showToast(message, this.WARNING);
  }
}

const toast = new Toast();
export default toast;
