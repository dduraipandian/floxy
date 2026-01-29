import { EmitterComponent } from "@uiframe/core";

class SelectionToolbar extends EmitterComponent {
  constructor({ selection, options = {} }) {
    super({ name: "floxy-selection-toolbar" });
    this.selection = selection;
    this.options = options;
    this.x = null;
    this.y = null;
  }

  html() {
    return `
        <div id="floxy-selection-toolbar-btn-group" class="list-group tools list-group-horizontal-sm floxy-selection-toolbar" style="width: fit-content;">
        </div>`;
  }

  init() {
    this.container = this.container.querySelector("#floxy-selection-toolbar-btn-group");
    this.updateView();
  }

  updateView() {
    this.container.innerHTML = "";

    this.container.style.zIndex = "1000";
    this.container.style.height = "fit-content";

    if (!this.selection.active) {
      this.container.style.display = "none";
      return;
    }

    this.container.style.display = "flex";
    this.container.style.position = "absolute";

    const commands = [...this.selection.commands];

    commands
      .sort((a, b) => (a.constructor.order ?? 0) - (b.constructor.order ?? 0))
      .forEach((cmd) => {
        const btn = document.createElement("a");
        btn.classList.add("list-group-item");
        btn.classList.add("tool-item");
        if (cmd.constructor.icon) btn.innerHTML = cmd.constructor.icon;
        else btn.textContent = cmd.constructor.label;
        if (cmd.constructor.toolclass) btn.classList.add(cmd.constructor.toolclass);
        btn.onclick = () => {
          const success = this.selection.execute(cmd.constructor.capability);
          if (success && cmd.clearSelection) this.updateView();
        };

        this.container.appendChild(btn);
      });
    this.position();
  }

  position() {
    const bounds = this.selection.getBounds();
    if (!bounds) return;

    if (this.selection.cx) {
      const x = this.selection.cx;
      const y = this.selection.cy + 16;

      // connection
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
    } else {
      // node
      const btnGroupWidth = this.container.offsetWidth;
      this.container.style.left = `${bounds.left + bounds.width / 2 - btnGroupWidth / 2 + 5}px`;
      this.container.style.top = `${bounds.top + bounds.height + 16}px`;
    }
  }

  hide() {
    this.container.style.display = "none";
  }

  show() {
    this.container.style.display = "block";
  }
}

export { SelectionToolbar };
