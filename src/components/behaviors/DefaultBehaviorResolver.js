class DefaultBehaviorResolver {
  constructor({ registry }) {
    this.registry = registry;
  }

  resolve(type, component, context = {}) {
    const resolved = new Set();

    component.model.capabilities.forEach((capability) => {
      const BehaviorCls = this.registry.get(type, capability);
      if (BehaviorCls) {
        const behaviorInstance = new BehaviorCls({ type, component, options: context });
        console.log("behaviorInstance", behaviorInstance);
        resolved.add(behaviorInstance);
      }
    });

    return resolved;
  }
}

export { DefaultBehaviorResolver };
