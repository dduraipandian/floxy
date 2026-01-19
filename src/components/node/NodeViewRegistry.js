class NodeViewRegistry {
    constructor() {
        this.views = new Map();
    }

    register(type, name, ViewClass) {
        this.views.set(type + ":" + name, ViewClass);
    }

    get(type, name) {
        return this.views.get(type + ":" + name);
    }
}

export const nodeViewRegistry = new NodeViewRegistry();
