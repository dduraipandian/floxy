class _BehaviorRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(BehaviorClass) {
    const name = BehaviorClass.behavior;
    const type = BehaviorClass.type;
    if (!name) {
      throw new Error(`Behavior ${BehaviorClass.name} must define static behavior`);
    }
    if (!type) {
      throw new Error(`Behavior ${BehaviorClass.type} must define static type`);
    }
    if (!this._registry.has(type)) {
      this._registry.set(type, new Map());
    }
    this._registry.get(type).set(name, BehaviorClass);
  }

  get(type, name) {
    return this._registry.get(type)?.get(name);
  }

  getAll(type) {
    return Array.from(this._registry.get(type)?.values() || []);
  }
}

const defaultBehaviorRegistry = new _BehaviorRegistry();

export { defaultBehaviorRegistry };
