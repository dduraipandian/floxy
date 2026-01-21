class DefaultBehaviorResolver {
  constructor({ registry }) {
    this.registry = registry;
  }

  resolve(node, context = {}) {
    const resolved = new Set();

    node.model.capabilities.forEach((capability) => {
      const BehaviorCls = this.registry.get(capability);
      if (BehaviorCls) {
        resolved.add(new BehaviorCls({ node, options: context }));
      }
    });

    return resolved;
  }
}

export { DefaultBehaviorResolver };
