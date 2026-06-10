import { localHistoryStore } from "./localHistoryStore";

let activeHistoryStore = localHistoryStore;

export function getHistoryStore() {
  return activeHistoryStore;
}

export function setHistoryStore(store = localHistoryStore) {
  activeHistoryStore = store;
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
