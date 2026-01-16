import { EmitterComponent } from "@uiframe/core";
import * as constants from "./constants.js";

const DEFAULT_SUPPORTED_BEHAVIORS = [
  constants.DEFAULT_NODE_BEHAVIORS.SELECTABLE,
  constants.DEFAULT_NODE_BEHAVIORS.DRAGGABLE,
];

class NodeModel extends EmitterComponent {
  constructor({
    id,
    name,
    inputs = 1,
    outputs = 1,
    x = 0,
    y = 0,
    h = 100,
    w = 200,
    data = {},
    contentHtml = "",
    supportedBehaviors = DEFAULT_SUPPORTED_BEHAVIORS,
  }) {
    super({ name: `node-model-${id}` });

    this.id = id;
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.data = data;
    this.contentHtml = contentHtml;
    this.supportedBehaviors = supportedBehaviors;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }
}

export { NodeModel };
