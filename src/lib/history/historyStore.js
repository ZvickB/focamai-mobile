import { localHistoryStore } from "./localHistoryStore";

let activeHistoryStore = localHistoryStore;

const listeners = new Set();

export function onHistoryStoreChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyHistoryStoreChanged() {
  listeners.forEach((fn) => fn());
}

export function getHistoryStore() {
  return activeHistoryStore;
}

export function setHistoryStore(store = localHistoryStore) {
  activeHistoryStore = store;
  notifyHistoryStoreChanged();
}

export const historyStore = {
  clear(...args) {
    return getHistoryStore().clear(...args);
  },

  list(...args) {
    return getHistoryStore().list(...args);
  },

  remove(...args) {
    return getHistoryStore().remove(...args);
  },

  save(...args) {
    return getHistoryStore().save(...args);
  },
};
