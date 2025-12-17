class EditorElement {
  constructor({ id, name, options = {} }) {
    this.id = id;
    this.name = name;
    this.options = options || {};
    this.editorType = options.editorType || "json"; // Default to JSON editor
    this.classNames = options.classNames || "";
    this.style = options.style || "";
    this.height = options.height || "600px";
  }

  renderHtml() {
    return `
      <div class="form-floating json-editor-container">
        <textarea 
          id="${this.id}"         
          class="${this.classNames}" 
          style="${this.style}"
          placeholder="${this.placeholder || this.name}"
          data-type="json"
        >${this.value}</textarea>
      </div>
    `;
  }

  attachEvents(container) {
    const textarea = container.querySelector(`#${this.id}`);
    const commonConfig = {
      theme: "dracula",
      lineNumbers: true,
      readOnly: true,
      autoRefresh: true
    };

    let jsonEditorConfig = {
      mode: "application/json",
      tabSize: 2,
      matchBrackets: true,
      autoCloseBrackets: true,
      foldGutter: true,
      lineWrapping: true,
      lint: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      ...commonConfig
    };

    let textEditorConfig = {
      mode: "text",
      ...commonConfig
    };

    if (this.editorType == "json") {
      jsonEditorConfig.lineWrapping = true;
      jsonEditorConfig.mode = {
        name: "javascript",
        json: true
      };
      jsonEditorConfig.gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
      this.editor = CodeMirror.fromTextArea(textarea, jsonEditorConfig);
    } else {
      this.editor = CodeMirror.fromTextArea(textarea, textEditorConfig);
    }

    this.editor.setSize("100%", this.height); // Set a default height

    if (this.value) {
      try {
        this.setValue(this.value);
      } catch (err) {
        console.warn("Invalid initial JSON value");
      }
    }
  }

  getValue() {
    try {
      if (this.editorType === "json") {
        return JSON.parse(this.editor.getValue());
      }
      // For text editor, return the raw value
      return this.editor.getValue();
    } catch {
      return null; // Or throw error if you want strict validation
    }
  }

  setValue(json) {
    if (this.editor) {
      this.editor.setValue(
        typeof json === "string" ? json : JSON.stringify(json, null, 2)
      );
    }
  }

  refresh() {
    if (this.editor) {
      this.editor.refresh();
    }
  }
}

export default EditorElement;
