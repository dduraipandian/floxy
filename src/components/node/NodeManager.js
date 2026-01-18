import { EmitterComponent } from "@uiframe/core";
import { Node } from "./Node.js";
import { NodeModel } from "./NodeModel.js";
import { FlowNodeView } from "./views/FlowNodeView.js";
import { BehaviorRegistry } from "./behaviors/BehaviorRegistry.js";
import { DefaultBehaviorResolver } from "./DefaultBehaviorResolver.js";
import * as constants from "../constants.js";

class NodeManager extends EmitterComponent {
  constructor({
    name,
    canvasContainer,
    zoomGetter,
    View = FlowNodeView,
    BehaviorRegistryCls = BehaviorRegistry,
    BehaviorResolverCls = DefaultBehaviorResolver,
  }) {
    super({ name: name + "node-manager" });
    this.canvasContainer = canvasContainer;
    this.zoomGetter = zoomGetter;
    this.View = View;
    this.nodes = new Map();
    this.idCounter = 1;

    this.BehaviorRegistryCls = BehaviorRegistryCls;
    this.BehaviorResolverCls = BehaviorResolverCls;

    this.behaviorResolver = new this.BehaviorResolverCls({ registry: this.BehaviorRegistryCls });
    this.behaviors = [];
  }

  dropNode(data) {
    console.debug("FLOW: Drop node", data);
    const nodeHeight = data.h ?? 100;
    const nodeWidth = data.w ?? 200;
    const zoom = this.zoomGetter();
    const posX = (data.x - nodeWidth / 2) / zoom;
    const posY = (data.y - nodeHeight / 2) / zoom;
    this.addNode({ ...data, x: posX, y: posY, w: nodeWidth, h: nodeHeight });
  }

  addNode(config) {
    console.debug("FLOW: Add node", config);
    const node = this.#createNode(config);

    node.renderInto(this.canvasContainer);
    node.init();

    this.nodes.set(node.id, node);
    return node.id;
  }

  #createNode(config) {
    const id = this.idCounter++;
    const model = new NodeModel({ id, ...config });
    const view = new this.View(model, { ...this.options, zoomGetter: this.zoomGetter });
    const node = new Node({ model, view });

    const behaviors = this.behaviorResolver.resolve(node);
    console.debug("FLOW: Node behaviors", node, behaviors);
    node.setBehaviors(behaviors);

    // bubble view events upward
    this.propagateEvent(constants.PORT_CONNECT_START_EVENT, view);
    this.propagateEvent(constants.PORT_CONNECT_END_EVENT, view);

    this.propagateEvent(constants.NODE_SELECTED_EVENT, view);
    this.propagateEvent(constants.NODE_DESELECTED_EVENT, view);

    this.propagateEvent(constants.NODE_MOVED_EVENT, node);

    view.on(constants.NODE_REMOVED_EVENT, (e) => this.removeNode(e.id));

    return node;
  }

  removeNode(id) {
    let node = this.getNode(id);
    if (!node) return;

    node.destroy();
    this.nodes.delete(id);
    this.emit(constants.NODE_REMOVED_EVENT, { id });
    node = null;
  }

  propagateEvent(event, instance) {
    instance.on(event, (e) => this.emit(event, e));
  }

  reset() {
    Object.values(this.nodes).forEach((n) => {
      n.destroy();
    });
    this.nodes.clear();
    this.idCounter = 1;
  }

  getNode(id) {
    const n = this.nodes.get(id);
    return n;
  }
}

export { NodeManager };
