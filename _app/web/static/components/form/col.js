class ColumnElement {
  constructor({ element, options = {} }) {
    this.element = element;
    this.colPosition = options.colPosition;
    this.classNames = options.classNames || "px-1 py-1";
    this.style = options.style || "";
  }

  render() {
    const defaultCol = "col-lg-6 col-md-6 col-sm-12 col-12";
    let attrFullCol = defaultCol;
    let rowBreak = "";
    switch (this.colPosition) {
      case "occupy":
        // Full width column
        attrFullCol = "col";
        rowBreak = '<div class="w-100"></div>';
        break;
      case "full":
        // Full width column
        attrFullCol = "col-12";
        break;
      case undefined:
        attrFullCol = defaultCol;
        break;
      default:
        // Default to a standard column
        attrFullCol = this.colPosition + " col-sm-12";
        rowBreak = '<div class="w-100 d-lg-none d-md-none d-sm-block"></div>';
    }
    const emptyCol = `<div class="${this.classNames}" style="min-height: 74px"></div>`;

    let templateString = `
            <div  
                class="${attrFullCol} ${this.classNames}" 
                ${this.style ? `style="${this.style}"` : ""}>
                    ${this.element.render()}
            </div>`;

    templateString += rowBreak;
    if (this.colPosition === "pre-empty") {
      templateString = emptyCol + templateString;
    } else if (this.colPosition === "post-empty") {
      templateString += emptyCol;
    }

    return templateString;
  }
}

export default ColumnElement;
