import emitter from "../emitter.js";

class TableContainer {
  constructor({ id, options = {} }) {
    this.id = id;
    this.table = null;
    this.data = [];
    this.columns = [];

    this.isDataTable = true;
    this.table = null;
    this.container = null;
    this.fields = options.fields || [];

    this.linkConfig = options.link || {};
    this.classNames = options.classNames || "";
    this.height = options.height || "auto"; // Default height
  }

  render() {
    return this.renderHtml();
  }

  getElementId() {
    return `${this.id}-table-container`;
  }

  renderHtml() {
    return `<div class="json-table ${this.classNames}" 
                    id="${this.getElementId()}">            
            </div> `;
  }

  attachEvents(container) {
    this.container = container.querySelector(`#${this.getElementId()}`);
    this.tableElement = container.querySelector(`#${this.id}`);
  }

  #initializeTable(data, columns) {
    this.data = data;
    this.columns = columns;

    const referenceFields = this.linkConfig?.fields || [];

    this.columns.unshift(""); // Add an empty column for row numbers

    // Clear any existing table
    this.container.innerHTML = "";

    // Create table element
    const table = document.createElement("table");
    table.id = this.id;
    table.classList.add("table", "table-striped", "table-hover", "table-sm");

    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    this.columns.forEach((col) => {
      const th = document.createElement("th");
      const div = document.createElement("div");
      div.classList.add("table-col-wrapper");
      div.textContent = col;
      th.appendChild(div);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");
    let rowCount = 0;
    this.data.forEach((rowData) => {
      const row = document.createElement("tr");
      rowCount += 1;
      rowData[""] = rowCount;
      let colCount = 0;

      this.columns.forEach((col) => {
        const div = document.createElement("div");
        div.classList.add("table-col-wrapper");

        const td = document.createElement("td");
        td.noWrap = true;

        let colData = rowData[col];
        let refData = {};
        referenceFields.forEach((refCol) => (refData[refCol] = rowData[refCol]));

        const refKey = this.linkConfig.key;
        if (col == refKey) {
          const link = document.createElement("a");
          let listen = this.linkConfig.listen;
          link.classList.add("table-identifier-link", "clickable");
          for (const refCol of referenceFields) {
            listen = listen ? listen.replace(`:${refCol}`, refData[refCol]) : "#";
          }
          link.addEventListener("click", (event) => {
            event.preventDefault();
            emitter.emit(listen, rowData);
          });
          link.textContent = colData;
          div.appendChild(link);
        } else if (typeof colData == "object") {
          let jsonTxt = JSON.stringify(colData);

          const jsonDiv = document.createElement("div");
          jsonDiv.classList.add("d-flex", "gap-3");

          const nestedDiv = document.createElement("div");
          const iconDiv = document.createElement("div");
          iconDiv.style.minWidth = "30px";

          const icon = document.createElement("i");
          icon.classList.add("bi", "bi-eye", "clickable", "float-end", "d-none", "hover-light");
          icon.style.minWidth = "20px";
          icon.setAttribute("type", "button");
          // icon.setAttribute('data-bs-toggle', 'offcanvas');
          // icon.setAttribute('data-bs-target', `${this.id}-canvas`);

          // icon.addEventListener('click', () => {
          //     const canvasBody = document.querySelector(`#${this.id}-canvas-body`);
          //     canvasBody.innerHTML = `<pre class="json-pretty">${JSON.stringify(colData, null, 2)}</pre>`;
          //     const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(document.querySelector(`#${this.id}-canvas`));
          //     offcanvas.show();
          // });
          iconDiv.appendChild(icon);

          nestedDiv.classList.add("json-nested-object");
          nestedDiv.textContent = jsonTxt;

          jsonDiv.appendChild(nestedDiv);
          jsonDiv.appendChild(iconDiv);
          div.appendChild(jsonDiv);
        } else {
          div.textContent = colData || "";
        }
        td.appendChild(div);

        if (colCount == 0) {
          td.style.width = "30px"; // Set width for the first column
          td.style.textAlign = "center"; // Center align the first column
        }
        colCount += 1;

        row.appendChild(td);
      });
      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Append table to container
    this.container.appendChild(table);
  }

  #nullTable() {
    this.data = [];
    this.columns = [];
    this.isDataTable = false;
    this.#initializeTable(this.data, this.columns);
  }

  setValue(newData) {
    try {
      var data = [];
      if (!Array.isArray(newData)) data.push(newData);
      else data = newData;

      this.data = data;
      if (this.fields.length === 0) {
        if (this.columns.length === 0 && this.data.length > 0) {
          this.columns = Object.keys(this.data[0]);
        }
        console.log(1, this.columns);
      } else {
        this.columns = [...this.fields];
      }
      this.#initializeTable(this.data, this.columns);
    } catch (error) {
      console.error(`Error refreshing table: ${error.message}`);
      this.#nullTable();
    }
    new DataTable(`#${this.id}`, { responsive: true });

    let parent = $(`#${this.id}`).parent();

    $(`#${this.id}_wrapper`).addClass("row");

    const c = $(`#${this.getElementId()} .dt-container.dt-bootstrap5`).children();

    if (c.length >= 3) {
      c[0].classList.add("ps-4", "pe-0");
      c[2].classList.add("ps-4", "pe-0", "pb-1");
    }

    parent.addClass("p-0");
    parent.css("height", this.height);
    parent.css("overflow-x", "auto");
    parent.parent().addClass("ms-0");
    $(`#${this.getElementId()} .dt-search input`).attr("placeholder", "Search...");

    // const canvasHtml = `<div class="div-canvas offcanvas offcanvas-end"
    //         tabindex="-1" id="${this.id}-canvas"
    //         aria-labelledby="${this.id}-canvas-label">
    //             <div id="${this.id}-canvas-body" class="offcanvas-body"></div>
    //     </div>`
    // parent.append(canvasHtml);
  }
}

export default TableContainer;
