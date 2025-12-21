class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, handler) {
    (this.events[event] ||= []).push(handler);
  }

  emit(event, payload) {
    (this.events[event] || []).forEach((fn) => fn(payload));
  }

  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((fn) => fn !== handler);
  }

  clear(event) {
    if (event) delete this.events[event];
    else this.events = {};
  }
}

// Singleton instance
const emitter = new EventEmitter();
export default emitter;
