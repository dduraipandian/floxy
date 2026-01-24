class NodeViewRegistry {
  constructor() {
    this.views = new Map();
  }

  register(ViewClass) {
    const modelDefaults = ViewClass.modelDefaults;
    this.views.set(
      modelDefaults.module + ":" + modelDefaults.group + ":" + modelDefaults.name,
      ViewClass
    );
  }

  get(module, group, name) {
    return this.views.get(module + ":" + group + ":" + name);
  }

  values() {
    return Array.from(this.views.values());
  }
}

export const nodeViewRegistry = new NodeViewRegistry();
