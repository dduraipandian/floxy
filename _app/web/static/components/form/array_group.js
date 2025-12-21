import BaseNonPrimitiveElement from "./base.js";
import Group from "./group.js";

class ArrayGroup extends BaseNonPrimitiveElement {
  constructor({ id, name, value = [], options = {} }) {
    if (!id || !name) {
      throw new Error("ID and name are required parameters.");
    }
    super({ id, label: name, name, value, options });
    this.show = options.show ? "show" : ""; // Inline styles for the form
    this.length = 0;
    this._formElements = []; // Array to hold form elements
    this.groupOptions = {
      collapse: {
        enabled: options.collapse?.enabled || false,
      },
    };
  }

  renderHtml() {
    const groupedElementsHTML = this.addArrayGroup();
    return `
        <div class="col-12">
            <div class="p-3 px-1">
                <div class="row app-array-group pb-2 rounded">
                    <div class="d-inline-flex floating ps-0 pe-1 pb-2">
                        <span class="group-header ${this.classNames}"
                                type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#${this.id}" 
                                aria-expanded="false" 
                                aria-controls="${this.id}">
                            <i class="bi bi-arrows-collapse ms-2 fs-5 float-start"></i>
                            <span class="align-middle float-end mt-1 ms-2"> ${this.name} config</span>
                        </span>
                        <i class="bi bi-plus-circle-fill text-success ms-2 fs-5 clickable"  
                            onclick="window.formElements['${this.getFormId()}']['${this.id}'].addGroup()"></i>
                    </div>       
                    <div class="collapse show app-input-group scrollbar pb-1" id="${this.id}">
                        ${groupedElementsHTML}
                    </div>
                </div>
            </div>
        </div>`;
  }
  addElement(element, propertyConfig = {}) {
    this._formElements.push({ element, propertyConfig });
    this.registerElement(element); // Register the element globally for forms access
  }

  addArrayGroup() {
    let groupId = `${this.id}-${this.length}`;
    let group = new Group({
      id: `ag-${groupId}`,
      name: groupId || "Group",
      options: this.groupOptions,
    });
    this._formElements.forEach(({ element, propertyConfig }) => {
      const ele = element.clone(`${element.id}-${this.length}`);
      group.addElement(ele, propertyConfig);
    });

    super.addElement(group, { order: this.length });

    const groupedElementsHTML = group.renderHtml();

    let removeGroupDiv = `<span class="col-1 p-0">
                <div class="col p-0 mt-3 p-1">
                    <i class="bi bi-dash-circle-fill text-danger fs-5 clickable" 
                    style="margin-left: -.5rem"
                    onclick="window.formElements['${this.getFormId()}']['${this.id}'].removeGroup('${groupId}')"></i>                    
                </div>
        </span>`;
    this.length += 1; // Increment the length for each new element added
    console.debug(`ArrayGroup with id: ${this.id} now has length: ${this.length}`);
    return `
            <div class="row array-group-item" id="${groupId}">
                <div class="col-11">
                    <div class="row">${groupedElementsHTML}</div>
                </div>
                <div class="col-1">${removeGroupDiv}</div>
            </div>`;
  }

  /**
   * Adds a new group to the array dynamically
   */
  addGroup() {
    try {
      const newGroupHtml = this.addArrayGroup();
      const containerElement = document.querySelector(`#${this.id}`);

      if (containerElement) {
        containerElement.insertAdjacentHTML("beforeend", newGroupHtml);
        console.debug(`Added new group to ArrayGroup: ${this.id}. New length: ${this.length}`);
      } else {
        console.warn(`Container element for ArrayGroup ${this.id} not found`);
      }
    } catch (error) {
      console.error(`Error adding group to ${this.id}:`, error);
    }
  }

  /**
   * Removes a group from the array by its inputId
   * @param {string} inputId - The ID of the group div to remove
   */
  removeGroup(groupId) {
    try {
      // Find and remove the DOM element
      const groupElement = document.getElementById(groupId);
      if (groupElement) {
        groupElement.remove();
        console.debug(`Removed group with id: ${groupId} from ArrayGroup: ${this.id}`);

        // Find and remove the corresponding group from formElements array
        const groupIndex = this.formElements.findIndex((element) => element.id === `ag-${groupId}`);

        if (groupIndex !== -1) {
          this.formElements.splice(groupIndex, 1);
          console.debug(`Removed group from formElements array. New length: ${this.length}`);
        }
      } else {
        console.warn(`Group element with id ${groupId} not found in DOM`);
      }
    } catch (error) {
      console.error(`Error removing group ${groupId}:`, error);
    }
  }

  getValue() {
    const data = [];
    this.formElements.forEach((element) => {
      if (element.getValue) {
        const value = element.getValue();
        // If primary keys are defined, check if they have values
        if (this.hasValidPrimaryKeys(value)) {
          data.push(value);
        }
      }
    });
    console.debug(`Exported data from ArrayGroup with id: ${this.id}`, data);
    return data;
  }

  setValue(data) {
    if (!Array.isArray(data)) {
      throw new Error("Invalid data provided for import. Expected an array.");
    }

    for (let i = 0; i < this.length; i++) {
      let groupId = `${this.id}-${i}`;
      const groupElement = document.getElementById(groupId);
      if (groupElement) groupElement.remove();
    }

    this.length = 0; // Reset length before adding new groups
    console.debug(`Importing data into ArrayGroup with id: ${this.id}`, data);

    data.forEach((elementData, index) => {
      if (elementData !== undefined) {
        this.addGroup();
        const element = this.formElements[this.length - 1];
        if (element && element.setValue) {
          element.setValue(elementData);
        }
      }
    });
  }

  hasValidPrimaryKeys(value) {
    if (!this.options["primary-keys"] || !Array.isArray(this.options["primary-keys"])) {
      return true; // No primary keys defined, consider all values valid
    }
    return this.options["primary-keys"].every(
      (key) => value[key] !== undefined && value[key] !== null && value[key] !== ""
    );
  }
}

export default ArrayGroup;
