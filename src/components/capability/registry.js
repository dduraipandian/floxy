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
    // context will be used to create resolved instances.
    // for example, Behavior requires state of the component. so it requires component and options to be passed to constructor.
    // so context will be { component, options }
    // Command does not require state of the component. So it does not require component to be passed to constructor.
    // resolver will not know the what type of instance is required. So it will create instance using the context.
    const resolved = new Set();

    component.model.capabilities?.forEach((capability) => {
      const CapabilityCls = this.get(capability);
      if (CapabilityCls) {
        const capabilityInstance = new CapabilityCls(context);
        resolved.add(capabilityInstance);
      }
    });

    return resolved;
  }
}

export { CapabilityRegistry };
