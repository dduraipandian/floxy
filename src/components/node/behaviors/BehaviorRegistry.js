class _BehaviorRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(BehaviorClass) {
    const name = BehaviorClass.behavior;
    if (!name) {
      throw new Error(`Behavior ${BehaviorClass.name} must define static behavior`);
    }
    this._registry.set(name, BehaviorClass);
  }

  get(name) {
    return this._registry.get(name);
  }

  getAll() {
    return Array.from(this._registry.values());
  }
}

let BehaviorRegistry = new _BehaviorRegistry();

export { BehaviorRegistry };
