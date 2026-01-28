class CapabilityRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(CapabilityClass) {
    const name = CapabilityClass.capability;
    if (!name) {
      throw new Error(`Capability ${CapabilityClass.name} must define static capability`);
    }
    this._registry.set(name, CapabilityClass);
  }

  get(name) {
    return this._registry.get(name);
  }

  getAll() {
    return Array.from(this._registry.values() || []);
  }

  resolve(component, context = {}) {
    const resolved = new Set();

    component.model.capabilities?.forEach((capability) => {
      const CapabilityCls = this.get(capability);
      if (CapabilityCls) {
        const capabilityInstance = new CapabilityCls({ component, options: context });
        console.log("capabilityInstance", capabilityInstance);
        resolved.add(capabilityInstance);
      }
    });

    return resolved;
  }
}

export { CapabilityRegistry };
