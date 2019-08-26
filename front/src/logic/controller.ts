import { Store, load, update, sync } from "./store";
import { Document } from "./document";

export const on = (
  store: Store,
  events: string,
  callback: ([...any]) => void
) => {
  const names = events.split(/\s*,\s*/);

  names.forEach(event => store.events.on(event, callback));
  return store;
};

export const dispatch = (store: Store, name: string, data: any) => {
  store.events.emit(name, data);
};

const onInit = (id: string, secret: string) => {
  load(id, secret);
};

const onUpdate = (document: Document) => {
  update(document);
};

const onSync = () => {
  sync();
};

export const initController = (store: Store) => {
  store.events.on("action:init", onInit);
  store.events.on("action:update", onUpdate);
  store.events.on("action:sync", onSync);
};
