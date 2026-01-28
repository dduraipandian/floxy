import { EmitterComponent } from "@uiframe/core";

class SelectionToolbar extends EmitterComponent {
  constructor({ selection, options = {} }) {
    super({ name: "floxy-selection-toolbar" });
    this.selection = selection;
    this.options = options;
  }

  html() {
    return "";
  }

  init() {
    this.updateView();
  }

  updateView() {
    this.container.innerHTML = `
        <div id="floxy-selection-toolbar-btn-group" class="btn-group btn-group-sm role="group" aria-label="floxy flow toolbar">
        </div>`;

    this.container.style.position = "absolute";
    this.container.style.zIndex = "1000";
    this.container.style.height = "fit-content";

    const btnGroup = this.container.querySelector("#floxy-selection-toolbar-btn-group");
    if (!this.selection.active) {
      this.container.style.display = "none";
      return;
    }

    this.container.style.display = "block";

    const commands = [...this.selection.commands];

    commands
      .sort((a, b) => (a.constructor.order ?? 0) - (b.constructor.order ?? 0))
      .forEach((cmd) => {
        const btn = document.createElement("button");
        btn.classList.add("btn");
        if (cmd.constructor.icon) btn.innerHTML = cmd.constructor.icon;
        else btn.textContent = cmd.constructor.label;
        if (cmd.constructor.toolclass) btn.classList.add(cmd.constructor.toolclass);
        else btn.classList.add("btn-outline-secondary");
        btn.onclick = () => {
          const success = this.selection.execute(cmd.constructor.capability);
          if (success && cmd.clearSelection) this.updateView();
        };

        btnGroup.appendChild(btn);
      });
    this.position(btnGroup);
  }

  position(btnGroup) {
    const bounds = this.selection.getBounds();
    if (!bounds) return;

    const btnGroupWidth = btnGroup.offsetWidth;

    this.container.style.left = `${bounds.left + bounds.width / 2 - btnGroupWidth / 2 + 5}px`;
    this.container.style.top = `${bounds.top + bounds.height + 16}px`;
  }
}

export { SelectionToolbar };
