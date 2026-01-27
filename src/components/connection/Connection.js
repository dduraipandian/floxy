import { EmitterComponent } from "@uiframe/core";
import * as constants from "../constants.js";

class Connection extends EmitterComponent {
  constructor({ model, view, nodeManager, behaviors = new Set() }) {
    super({ name: `connection-${model.id}` });

    this.model = model;
    this.view = view;
    this.nodeManager = nodeManager;
    this.destroyed = false;

    this._source = null;
    this._target = null;

    this.behaviors = behaviors;
    this.id = this.model.id;
  }

  get outNodeId() {
    return this.model.outNodeId;
  }

  get inNodeId() {
    return this.model.inNodeId;
  }

  get inPort() {
    return this.model.inPort;
  }

  get outPort() {
    return this.model.outPort;
  }

  get source() {
    if (!this._source)
      this._source = {
        nodeId: this.model.source.nodeId,
        portIndex: this.model.source.portIndex,
      };
    return this._source;
  }

  get target() {
    if (!this._target)
      this._target = {
        nodeId: this.model.target.nodeId,
        portIndex: this.model.target.portIndex,
      };
    return this._target;
  }

  renderInto(container) {
    this.view.renderInto(container);
    this.init();
  }

  init() {
    this.update();
    this.attachBehaviors();
    console.log("Connection init", this.behaviors);
  }

  update() {
    const sourceNode = this.nodeManager.getNode(this.model.source.nodeId);
    const targetNode = this.nodeManager.getNode(this.model.target.nodeId);
    const meta = {
      sourceBounds: sourceNode.view.getBounds(),
      targetBounds: targetNode?.view.getBounds(),
    };
    this.view.update(sourceNode, targetNode, meta);
  }

  updateWithXY(x, y) {
    const sourceNode = this.nodeManager.getNode(this.source.nodeId);

    if (!sourceNode) return;

    const p1 = sourceNode.view.getPortPosition({
      type: "output",
      index: this.source.portIndex,
    });

    const p2 = { x, y };

    const meta = {
      sourceBounds: sourceNode.view.getBounds(),
    };

    this.view.updateTempPath(p1, p2, meta);
  }

  markBadPath() {
    this.model.style.markBad(true);
    this.view.applyStyle();
  }

  destroy() {
    this.view.destroy();
    this.view = null;
    this.model = null;
    this.nodeManager = null;
    this.destroyed = true;
  }

  clearBadPath() {
    this.model.style.markBad(false);
    this.view.applyStyle();
  }

  setPathStyle(pathType) {
    this.model.pathType = pathType;
    this.view.updatePath();
  }

  select() {
    this.view.setSelected(true);
    this.emit(constants.CONNECTION_SELECTED_EVENT, { id: this.model.id });
  }

  deselect() {
    this.view.setSelected(false);
    this.emit(constants.CONNECTION_DESELECTED_EVENT, { id: this.model.id });
  }

  setBehaviors(behaviors) {
    this.behaviors = behaviors;
  }

  addBehavior(behavior) {
    this.behaviors.add(behavior);
  }

  removeBehavior(behavior) {
    this.behaviors.delete(behavior);
  }

  attachBehaviors() {
    this.behaviors.forEach((b) => {
      try {
        b._attach();
      } catch (error) {
        console.error("Failed to attach behavior", b, error);
      }
    });
  }

  isCapabilitySupported(capability) {
    return this.model.capabilities.includes(capability);
  }
}

export { Connection };
