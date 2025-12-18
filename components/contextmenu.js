import Dropdown from './dropdown.js';

class ContextMenu extends Dropdown {
    constructor({ name, options = {} }) {
        options.contextMenu = true;
        super({ name, options });
        this.menu = null;
        this.dropdown = null;
        this.currentContext = null;
    }

    init() {
        super.init();
        this.element = this.container;
        this.dropDownButton = this.element.querySelector(`#${this.dropDownId}-toggle`);        
        setTimeout(() => {
            this.dropdown = new bootstrap.Dropdown(this.dropDownButton, {
                popperConfig: null   // 🔴 hard-disable Popper
            });
            // Hide on click elsewhere
            document.addEventListener("click", () => {            
                this.hide();
            });
            document.addEventListener("scroll", () => {            
                this.hide();
            });
            this.menu = this.element.querySelector(`#${this.dropDownId}-menu`);
        }, 1000);
    }

    show(event) {
        event.preventDefault();
        let container = event.target;
        while (container && !container.classList.contains('context-menu-container')) {
            container = container.parentElement;
        }
        if (!container) {
            return;
        }

        const x = event.clientX;
        const y = event.clientY;

        // 1️⃣ force reset bootstrap state
        this.hide();

        // 2️⃣ set position
        console.log(x, y);
        this.menu.style.left = x + "px";
        this.menu.style.top = y + "px";
        this.menu.style.position = "fixed";

        // 3️⃣ wait for layout + bootstrap cleanup
        requestAnimationFrame(() => {
            this.dropdown.show();
        });
        this.currentContext = container;
    }
    hide() {
        this.dropdown.hide();
        this.currentContext = null;
    }
    itemOnClick(link, item) {
        let node = {
            "node": this.currentContext,
            "item": item
        }
        this.emit(`item:click`, node);        
    }
}

export default ContextMenu;