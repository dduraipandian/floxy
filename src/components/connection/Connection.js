import { EmitterComponent } from "@uiframe/core";
import * as constants from "../constants.js";

class Connection extends EmitterComponent {
  constructor({ model, view, nodeManager, behaviors = new Set() }) {
    super({ name: `connection-${model.id}` });

    this.model = model;
    this.view = view;
    this.nodeManager = nodeManager;
    this.destroyed = false;

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
    return {
      nodeId: this.model.outNodeId,
      portIndex: this.model.outPort,
    };
  }

  get target() {
    return {
      nodeId: this.model.inNodeId,
      portIndex: this.model.inPort,
    };
  }

  get detachedSource() {
    return this.model.detachedSource;
  }

  get detachedTarget() {
    return this.model.detachedTarget;
  }

  detachSource() {
    this.model.detachedSource = true;
  }

  detachTarget() {
    this.model.detachedTarget = true;
  }

  renderInto(container) {
    this.view.renderInto(container);
    this.init();
  }

  init() {
    this.update();
    this.attachBehaviors();
  }

  update() {
    if (this.detachedSource || this.detachedTarget) {
      this.updateFrozenPath();
      return;
    }

    const sourceNode = this.nodeManager.getNode(this.model.source.nodeId);
    const targetNode = this.nodeManager.getNode(this.model.target.nodeId);
    const meta = {
      sourceBounds: sourceNode.view.getBounds(),
      targetBounds: targetNode.view.getBounds(),
    };
    this.view.update(sourceNode, targetNode, meta);
    this.updateConnectionPosition("source", sourceNode, "output", this.source.portIndex);
    this.updateConnectionPosition("target", targetNode, "input", this.target.portIndex);
  }

  updateConnectionPosition(type, node, portType, portIndex) {
    this.model.frozenPosition[type] = node.view.getPortPosition({
      type: portType,
      index: portIndex,
    });
    this.model.frozenBounds[type] = node.view.getBounds();
  }

  updateFrozenPath() {
    if (!this.detachedSource) {
      const sourceNode = this.nodeManager.getNode(this.model.source.nodeId);
      this.updateConnectionPosition("source", sourceNode, "output", this.source.portIndex);
    }
    if (!this.detachedTarget) {
      const targetNode = this.nodeManager.getNode(this.model.target.nodeId);
      this.updateConnectionPosition("target", targetNode, "input", this.target.portIndex);
    }
    const sourcePos = this.model.frozenPosition.source;
    const targetPos = this.model.frozenPosition.target;
    const meta = {
      sourceBounds: this.model.frozenBounds.source,
      targetBounds: this.model.frozenBounds.target,
    };
    this.view.updateFrozenPath(sourcePos, targetPos, meta);
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

  select(cx, cy) {
    this.view.setSelected(true);
    this.emit(constants.CONNECTION_SELECTED_EVENT, { id: this.model.id, cx, cy });
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
