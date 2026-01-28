import { BaseCommand } from "./base.js";

class RemovableCommand extends BaseCommand {
    static get capability() {
        return "removable";
    }

    get clearSelection() {
        return true;
    }

    // eslint-disable-next-line no-unused-vars
    execute(flow, manager, component) {
        manager.remove(component.id);
        return true;
    }
}

export { RemovableCommand };
