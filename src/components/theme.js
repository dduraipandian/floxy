import { EmitterComponent } from "@uiframe/core";

class ThemeManager {
  constructor(root = document.documentElement) {
    this.root = root;
  }

  setToken(name, value) {
    this.root.style.setProperty(`--floxy-${name}`, value);

    // Auto-update grid image when type changes
    if (name === "grid-type") {
      const typeVar = value === "lines" ? "var(--grid-lines)" : "var(--grid-dots)";
      this.root.style.setProperty("--floxy-grid-image", typeVar);
    }
  }

  setTheme(theme) {
    Object.entries(theme).forEach(([k, v]) => {
      this.setToken(k, v);
    });
  }

  getToken(name) {
    return getComputedStyle(this.root).getPropertyValue(`--floxy-${name}`).trim();
  }
}

class ThemeEditor extends EmitterComponent {
  constructor(options = {}) {
    super({ name: "flow-theme-editor" });
    this.manager = options.manager || new ThemeManager();
    this.isOpen = false;
    this.config = [
      {
        category: "Brand Colors",
        group: true,
        tokens: [
          { name: "primary-color", label: "Primary", type: "color" },
          { name: "secondary-color", label: "Secondary", type: "color" },
          { name: "danger-color", label: "Danger", type: "color" },
          { name: "warning-color", label: "Warning", type: "color" },
          { name: "info-color", label: "Info", type: "color" },
        ],
      },
      {
        category: "Nodes",
        tokens: [
          { name: "node-bg", label: "Background", type: "color" },
          { name: "node-border", label: "Border", type: "color" },
          {
            name: "node-border-width",
            label: "Border Width",
            type: "range",
            min: 0,
            max: 10,
            unit: "px",
          },
          {
            name: "node-radius",
            label: "Corner Radius",
            type: "range",
            min: 0,
            max: 50,
            unit: "px",
          },
        ],
      },
      {
        category: "Labels",
        tokens: [
          { name: "label-color", label: "Text Color", type: "color" },
          {
            name: "label-font-size",
            label: "Font Size",
            type: "range",
            min: 8,
            max: 24,
            unit: "px",
          },
        ],
      },
      {
        category: "Ports",
        tokens: [
          { name: "port-size", label: "Size", type: "range", min: 4, max: 20, unit: "px" },
          {
            name: "port-radius",
            label: "Corner Radius",
            type: "range",
            min: 0,
            max: 50,
            unit: "%",
          },
          { name: "port-bg", label: "Input Background", type: "color" },
          { name: "port-output-bg", label: "Output Background", type: "color" },
          { name: "port-border", label: "Border", type: "color" },
        ],
      },
      {
        category: "Connections",
        tokens: [
          { name: "conn-color", label: "Color", type: "color" },
          { name: "conn-width", label: "Width", type: "range", min: 1, max: 10, unit: "px" },
          { name: "conn-hover-color", label: "Hover Color", type: "color" },
          { name: "conn-selected-color", label: "Selected Color", type: "color" },
          { name: "conn-bad-color", label: "Bad Color", type: "color" },
        ],
      },
      {
        category: "Grid",
        tokens: [
          {
            name: "grid-type",
            label: "Type",
            type: "select",
            options: [
              { label: "Dots", value: "dots" },
              { label: "Lines", value: "lines" },
            ],
          },
          { name: "grid-color", label: "Color", type: "color" },
          { name: "grid-size", label: "Size", type: "range", min: 10, max: 100, unit: "px" },
          {
            name: "grid-dot-radius",
            label: "Dot Radius",
            type: "range",
            min: 0.5,
            max: 5,
            step: 0.1,
            unit: "px",
          },
          {
            name: "grid-line-width",
            label: "Line Width",
            type: "range",
            min: 1,
            max: 5,
            unit: "px",
          },
        ],
      },
    ];
  }

  html() {
    return `      
            <button class="floxy-toggle-btn" id="floxy-theme-toggle" title="Customize Theme">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.185 1.184l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.184 1.185l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.291.16c-.764.415-1.6-.42-1.185-1.184l.159-.292a1.873 1.873 0 0 0-1.116-2.692l-.318-.094c-.835-.246-.835-1.428 0-1.674l.319-.094a1.873 1.873 0 0 0 1.115-2.693l-.16-.291c-.415-.764.42-1.6 1.184-1.185l.292.159a1.873 1.873 0 0 0 2.692-1.116l.094-.318z"/>
                </svg>
            </button>
            <div class="floxy-theme-editor swag" id="floxy-theme-panel">
                <div class="floxy-theme-header">
                    <h5 class="m-0 fw-bold" style="font-size: 0.95rem; color: #1c1c1e;">Theme Editor</h5>
                    <button type="button" class="btn-close" id="floxy-theme-close" style="font-size: 0.7rem; opacity: 0.6;"></button>
                </div>
                <div class="floxy-theme-body">
                    ${this.renderTokenControl()}
                </div>
                <div class="floxy-theme-footer">
                    <button class="btn btn-sm btn-primary flex-grow-1 py-2" id="floxy-download-theme">Download Theme</button>
                    <button class="btn btn-sm btn-outline-secondary flex-grow-1 py-2" id="floxy-export-css">Copy CSS</button>
                    <button class="btn btn-sm btn-link w-100 mt-2 text-muted" id="floxy-theme-reset" style="font-size: 0.75rem; text-decoration: none;">Reset Defaults</button>
                </div>
            </div>
        `;
  }

  render() {
    this.container.innerHTML = this.html();
    this.attachEvents();
  }

  init() {
    this.render();
  }

  renderTokenControl() {
    return this.config
      .map(
        (section) => `
            <div class="floxy-theme-section">
              ${this.#getCategory(section)}
            </div>
          `
      )
      .join("");
  }

  #getCategory(section) {
    const group = section.group ?? false;
    let html = `<h6>${section.category}</h6>`;
    if (group) {
      html += '<div style="display: flex; gap: 8px; flex-wrap: wrap;">';
      section.tokens.forEach((token) => {
        const currentValue = this.manager.getToken(token.name);
        html += `<input type="color" title="${token.label}" class="floxy-color-input" data-token="${token.name}" value="${this.rgbToHex(currentValue)}">`;
      });
      html += "</div>";
      return html;
    }
    html += `${section.tokens.map((token) => this.#getTokenControl(token)).join("")}`;
    return html;
  }

  #getTokenControl(token) {
    if (token.type === "color") {
      return this.#getColorTokenControl(token);
    } else if (token.type === "range") {
      return this.#getRangeTokenControl(token);
    } else if (token.type === "select") {
      return this.#getSelectTokenControl(token);
    }
  }

  #getColorTokenControl(token) {
    const currentValue = this.manager.getToken(token.name);
    return `
        <div class="floxy-token-row">
          <span class="floxy-token-label">${token.label}</span>
          <input type="color" class="floxy-color-input" data-token="${token.name}" value="${this.rgbToHex(currentValue)}">
        </div>
      `;
  }

  #getRangeTokenControl(token) {
    const currentValue = this.manager.getToken(token.name);
    const numericValue = parseFloat(currentValue) || 0;
    return `
        <div class="floxy-token-row" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="floxy-token-label">${token.label}</span>
            <span class="floxy-range-value" id="val-${token.name}">${currentValue}</span>
          </div>
          <input type="range" class="form-range floxy-range-input" 
            data-token="${token.name}" 
            data-unit="${token.unit || ""}"
            min="${token.min}" max="${token.max}" step="${token.step || 1}" 
            value="${numericValue}">
        </div>
      `;
  }

  #getSelectTokenControl(token) {
    const currentValue = this.manager.getToken(token.name) || token.options[0].value;
    return `
        <div class="floxy-token-row">
          <span class="floxy-token-label">${token.label}</span>
          <select class="form-select form-select-sm floxy-select-input w-50" data-token="${token.name}" style="font-size: 0.75rem;">
            ${token.options
        .map(
          (opt) => `
              <option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>${opt.label}</option>
            `
        )
        .join("")}
          </select>
        </div>
      `;
  }

  attachEvents() {
    const panel = this.container.querySelector("#floxy-theme-panel");
    const toggle = this.container.querySelector("#floxy-theme-toggle");
    const close = this.container.querySelector("#floxy-theme-close");
    const reset = this.container.querySelector("#floxy-theme-reset");
    const exportBtn = this.container.querySelector("#floxy-export-css");
    const downloadBtn = this.container.querySelector("#floxy-download-theme");

    toggle.onclick = () => {
      this.isOpen = !this.isOpen;
      panel.classList.toggle("open", this.isOpen);
    };

    close.onclick = () => {
      this.isOpen = false;
      panel.classList.remove("open");
    };

    panel.querySelectorAll("input, select").forEach((input) => {
      input.oninput = (e) => {
        const token = e.target.dataset.token;
        const unit = e.target.dataset.unit || "";
        const value = e.target.value + unit;

        this.manager.setToken(token, value);

        const valDisplay = this.container.querySelector(`#val-${token}`);
        if (valDisplay) valDisplay.textContent = value;
      };
    });

    reset.onclick = (e) => {
      e.preventDefault();
      if (confirm("Reset all theme variables to defaults?")) {
        window.location.reload();
      }
    };

    exportBtn.onclick = () => {
      let css = ":root {\n";
      this.config.forEach((section) => {
        section.tokens.forEach((token) => {
          css += `  --floxy-${token.name}: ${this.manager.getToken(token.name)};\n`;
        });
      });
      css += "}";

      navigator.clipboard.writeText(css).then(() => {
        const originalText = exportBtn.textContent;
        exportBtn.textContent = "Copied!";
        exportBtn.classList.add("btn-success");
        exportBtn.classList.remove("btn-outline-secondary");
        setTimeout(() => {
          exportBtn.textContent = originalText;
          exportBtn.classList.remove("btn-success");
          exportBtn.classList.add("btn-outline-secondary");
        }, 2000);
      });
    };

    downloadBtn.onclick = () => {
      let css = "/* Generated by Floxy Theme Editor */\n:root {\n";
      this.config.forEach((section) => {
        section.tokens.forEach((token) => {
          css += `  --floxy-${token.name}: ${this.manager.getToken(token.name)};\n`;
        });
      });
      css += "}";

      const blob = new Blob([css], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "floxy-theme.css";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  // Helper to convert rgb(r, g, b) to #rrggbb
  rgbToHex(col) {
    if (col.startsWith("#")) return col;
    const rgb = col.match(/\d+/g);
    if (!rgb || rgb.length < 3) return "#000000";
    return (
      "#" +
      rgb
        .slice(0, 3)
        .map((x) => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }
}

export { ThemeManager, ThemeEditor };
