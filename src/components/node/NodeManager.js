import { EmitterComponent } from "@uiframe/core";
import { Node } from "./Node.js";
import { NodeModel } from "./NodeModel.js";
import { DraggableBehavior } from "./behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "./behaviors/SelectableBehavior.js";
import { FlowNodeView } from "./views/FlowNodeView.js";
import * as constants from "./constants.js";

const DEFAULT_VIEW = FlowNodeView;
const DEFAULT_BEHAVIORS = [DraggableBehavior, SelectableBehavior];

class NodeManager extends EmitterComponent {
  constructor({
    name,
    canvasContainer,
    zoomGetter,
    View = DEFAULT_VIEW,
    Behaviors = DEFAULT_BEHAVIORS,
  }) {
    super({ name: name + "node-manager" });
    this.canvasContainer = canvasContainer;
    this.zoomGetter = zoomGetter;
    this.View = View;
    this.Behaviors = Behaviors;
    this.nodes = new Map();
    this.idCounter = 1;
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

    const id = this.idCounter++;

    const model = new NodeModel({ id, ...config });
    const view = new this.View(model, this.options);

    const node = new Node({
      model,
      view,
      behaviors: [
        ...this.Behaviors.map((b) => new b({ options: { zoomGetter: this.zoomGetter } })),
      ],
    });

    // bubble view events upward
    this.propagateEvent(constants.PORT_CONNECT_START_EVENT, view);
    this.propagateEvent(constants.PORT_CONNECT_END_EVENT, view);
    this.propagateEvent(constants.NODE_REMOVE_EVENT, view);

    this.propagateEvent(constants.NODE_MOVED_EVENT, node);

    node.renderInto(this.canvasContainer);
    node.init();
    this.nodes.set(id, node);

    return id;
  }

  removeNode(id) {
    const node = this.getNode(id);
    if (!node) return;

    node.destroy();
    this.nodes.delete(id);
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
