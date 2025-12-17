class Component {
    constructor({ name }) {
        if (new.target === Component) {
            throw new TypeError("Cannot construct Component instances directly");
        }

        this.name = name;
        this.containerID = this.name ? this.name.toLowerCase().replace(/\s+/g, '-') : `tab-${Math.random().toString(36).substring(2, 15)}`;
        this.id = this.containerID;
        this.container = null;

        this.created = false;
        this.rendered = false;

        this.parentContainer = null;
    }

    renderInto(container) {
        if (this.isRendered()) {
            console.warn(`'${this.name}' component is already rendered.`);
            return;
        }

        if (typeof container === "string") {
            container = document.getElementById(container);
            if (!container) {
                throw new Error(`Container with id ${container} not found`);
            }
        } else if (!(container instanceof HTMLElement)) {
            throw new Error("Container must be a valid HTMLElement or a string ID.");
        }

        if (!container.id) {
            throw new Error("Container must have a valid id.");
        }

        this.parentContainer = container;
        this.createContainer();
        this.parentContainer.appendChild(this.container);
        console.log("DOM is rendered into container ", container.id);
        this.rendered = true;
    }

    getParentContainer() {
        if(!this.rendered) {
            console.warn(`'${this.name}' component is not rendered yet.`);
            return null;
        }
        return this.parentContainer;
    }

    createContainer() {
        if (this.isCreated()) {
            if (this.container) return this.container;

            console.warn(`${this.component} component is already rendered.`);
            return;
        }
        this.container = this.#createAndGetElement();
        this.initContainer();

        return this.container;
    }

    getContainer() {
        if (!this.container) {
            this.createContainer();
        }
        return this.container;
    }

    #createAndGetElement() {
        const div = document.createElement('div');
        div.id = this.containerID;
        div.style.height = "100%";
        div.style.width = "100%";

        const template = this.html();

        div.insertAdjacentHTML('beforeend', template);
        return div;
    }

    initContainer() {
        this.init();
        this.created = true;
    }

    isCreated() {
        return this.created;
    }

    isRendered() {
        return this.rendered;
    }

    init() {
        throw new Error("Method 'init()' must be implemented in the subclass");
    }

    html() {
        throw new Error("Method '#html()' must be implemented in the subclass");
    }
}

class EmitterComponent extends Component {
    constructor({ name }) {
        super({ name });
        this.events = {};
    }

    on(event, handler) {
        (this.events[event] ||= []).push(handler);
    }

    emit(event, payload) {
        (this.events[event] || []).forEach(fn => fn(payload));
    }

    off(event, handler) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(fn => fn !== handler);
    }

    clear(event) {
        if (event) delete this.events[event];
        else this.events = {};
    }
}

export {EmitterComponent, Component};
