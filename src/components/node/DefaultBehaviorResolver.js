class DefaultBehaviorResolver {
  constructor({ registry }) {
    this.registry = registry;
  }

  resolve(node, context = {}) {
    const resolved = new Set();

    for (const BehaviorClass of this.registry.getAll()) {
      // 1. behavior declares its identity
      const behaviorName = BehaviorClass.behavior;

      // 2. view supports it?
      if (!node.view.behaviorSupported(behaviorName)) {
        continue;
      }

      // 3. model supports it?
      if (node.model.supportedBehaviors && !node.model.supportedBehaviors.includes(behaviorName)) {
        continue;
      }

      const behavior = new BehaviorClass(context);
      resolved.add(behavior);
    }

    return resolved;
  }
}

export { DefaultBehaviorResolver };
