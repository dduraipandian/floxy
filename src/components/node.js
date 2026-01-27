import { EmitterComponent } from "@uiframe/core";
import { Node } from "./node/Node.js";
import { NodeModel } from "./node/NodeModel.js";
import { defaultBehaviorRegistry } from "./behaviors/BehaviorRegistry.js";
import { DefaultBehaviorResolver } from "./behaviors/DefaultBehaviorResolver.js";
import { nodeViewRegistry } from "./node/NodeViewRegistry.js";
import { DefaultView } from "./node/views/packages/workflow/DefaultView.js";
import * as constants from "./constants.js";

class FlowNodeManager extends EmitterComponent {
  constructor({
    name,
    canvasContainer,
    zoomGetter = () => 1,
    View = DefaultView,
    viewRegistry = nodeViewRegistry,
    behaviorRegistry = defaultBehaviorRegistry,
    BehaviorResolverCls = DefaultBehaviorResolver,
  }) {
    super({ name: name + "node-manager" });
    this.canvasContainer = canvasContainer;
    this.zoomGetter = zoomGetter;
    this.View = View;
    this.viewRegistry = viewRegistry;
    this.nodes = new Map();
    this.idCounter = 1;

    this.behaviorRegistry = behaviorRegistry;
    this.BehaviorResolverCls = BehaviorResolverCls;

    this.behaviorResolver = new this.BehaviorResolverCls({ registry: this.behaviorRegistry });
    this.behaviors = [];
    this.type = "node";
  }

  dropNode(config) {
    console.debug("FLOW: Drop node", config);
    this.addNode(config, true);
  }

  addNode(config, isDropped = false) {
    console.debug("FLOW: Add node", config);

    let ViewClass = this.viewRegistry.get(config.module, config.group, config.name);
    if (!ViewClass) {
      console.warn(
        "No nodeview fond for {",
        config.module,
        config.group,
        config.name,
        "}. Using default view."
      );
      ViewClass = this.View;
    }
    const viewDefaults = ViewClass.modelDefaults;

    if (isDropped) {
      // dropping node mid point near to pointer
      const zoom = this.zoomGetter();
      const nodeHeight = config.h ?? viewDefaults.h ?? 100;
      const nodeWidth = config.w ?? viewDefaults.w ?? 200;
      const posX = (config.x - nodeWidth / 2) / zoom;
      const posY = (config.y - nodeHeight / 2) / zoom;
      config.x = posX;
      config.y = posY;
    }

    Object.keys(viewDefaults).forEach((key) => {
      const value = config[key];
      if (value === undefined || value === "undefined") {
        config[key] = viewDefaults[key];
      }
    });

    const node = this.#createNode(config, ViewClass);
    node.renderInto(this.canvasContainer);
    node.init();

    this.nodes.set(node.id, node);
    return node.id;
  }

  #createNode(config, ViewClass) {
    const id = this.idCounter++;

    const model = new NodeModel({ id, ...config });
    const view = new ViewClass(model, { ...this.options, zoomGetter: this.zoomGetter });
    const node = new Node({ model, view });

    const behaviors = this.behaviorResolver.resolve(this.type, node, this.options);
    node.setBehaviors(behaviors);

    // bubble view events upward
    this.propagateEvent(constants.PORT_CONNECT_START_EVENT, view);
    this.propagateEvent(constants.PORT_CONNECT_END_EVENT, view);

    this.propagateEvent(constants.NODE_SELECTED_EVENT, view);
    this.propagateEvent(constants.NODE_DESELECTED_EVENT, view);

    this.propagateEvent(constants.NODE_MOVED_EVENT, node);
    this.propagateEvent(constants.NODE_UPDATED_EVENT, node);
    this.propagateEvent(constants.NODE_LABEL_UPDATED_EVENT, node);

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

  getAllNodes() {
    return [...this.nodes.values()];
  }

  get size() {
    return this.nodes.size;
  }
}

export { FlowNodeManager };
