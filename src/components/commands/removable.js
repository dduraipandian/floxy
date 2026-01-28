import { BaseCommand } from "./base.js";

class RemovableCommand extends BaseCommand {
  static get capability() {
    return "removable";
  }

  get clearSelection() {
    return true;
  }

  execute(flow, manager, component) {
    manager.remove(component.id);
    return true;
  }

  static get label() {
    return "Delete";
  }
  static get order() {
    return 100;
  }
  static get icon() {
    return '<i class="bi bi-trash"></i>';
  }
  static get toolclass() {
    return "btn-danger";
  }
}

export { RemovableCommand };
