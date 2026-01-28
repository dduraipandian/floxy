import { BaseCapability } from "../capability/base.js";

class BaseCommand extends BaseCapability {
    static get capability() {
        throw new Error("Static property capability must be implemented in the subclass");
    }

    get clearSelection() {
        return false;
    }

    canExecute(component) {
        return this.isSupported(component);
    }

    run(flow, manager, component) {
        if (!this.canExecute(component)) {
            flow.notification?.error(`${this.constructor.capability} is not supported`);
            return false;
        }
        return this.execute(flow, manager, component);
    }

    execute(flow, manager, component) {
        throw new Error("Method 'execute()' must be implemented in the subclass");
    }
}

export { BaseCommand };
