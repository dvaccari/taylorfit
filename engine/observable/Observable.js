
const _events         = Symbol('events');
const _listeners      = Symbol('listeners');
const _listenerCount  = Symbol('listenerCount');

class Observable {

  constructor() {
    this[_events] = {};
    this[_listeners] = {};
    this[_listenerCount] = 0;
  }

  on(event, handler) {
    // If an array of events, register for each event
    if (Array.isArray(event)) {
      return event.map((ev) => this.on(ev, handler));
    }

    // Otherwise, register the sole event
    let id = this[_listenerCount] += 1;

    this[_listeners][id] = handler;

    if (!this[_events][event]) {
      this[_events][event] = [];
    }

    this[_events][event].push(id);
    return id;
  }

  removeListener(id) {
    // If an array of ids, unregister for each id
    if (Array.isArray(id)) {
      return id.every((ev) => this.removeListener(ev, id));
    }

    delete this[_listeners][id];

    Object.keys(this[_events]).forEach(
      (event) => this[_events][event] = this[_events][event].filter(
        (handlerId) => handlerId !== id));
    return true;
  }

  fire(event, data) {
    if (!this[_events][event]) {
      this[_events][event] = [];
    }
    this[_events][event].forEach((id) => this[_listeners][id](data));
  }

}

module.exports = Observable;
