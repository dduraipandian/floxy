class _PathRegistry {
  constructor() {
    this.paths = new Map();
  }

  register(type, fn) {
    this.paths.set(type, fn);
  }

  get(type) {
    return this.paths.get(type);
  }

  has(type) {
    return this.paths.has(type);
  }
}

let pathRegistry = new _PathRegistry();

export { pathRegistry };
