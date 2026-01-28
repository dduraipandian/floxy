import * as constants from "../constants.js";

class NodeModel {
  constructor({
    id,
    name,
    label,
    module = "default",
    group = "default",
    inputs = 1,
    outputs = 1,
    x = 0,
    y = 0,
    h = 100,
    w = 200,
    data = {},
    capabilities = constants.DEFAULT_SUPPORTED_CAPABILITIES,
  }) {
    this.id = id;
    this.module = module;
    this.group = group;
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.data = data;
    this.capabilities = capabilities;
    this.label = label ?? this.name;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }
}

export { NodeModel };
