const DB_NAME = 'syncspace-offline';
const DB_VERSION = 1;

let db;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('pending_edits')) {
        const store = database.createObjectStore('pending_edits', { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('docId', 'docId', { unique: false });
      }
      if (!database.objectStoreNames.contains('cached_docs')) {
        database.createObjectStore('cached_docs', { keyPath: 'docId' });
      }
      if (!database.objectStoreNames.contains('pending_tasks')) {
        const taskStore = database.createObjectStore('pending_tasks', { keyPath: 'id', autoIncrement: true });
        taskStore.createIndex('synced', 'synced', { unique: false });
      }
    };
    request.onsuccess = (e) => { db = e.target.result; resolve(db); };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveDocEdit = async (workspaceId, docId, content) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_edits', 'readwrite');
    const store = tx.objectStore('pending_edits');
    store.add({ docId: `workspace_${workspaceId}_doc_${docId}`, content, timestamp: Date.now(), synced: false });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingEdits = async () => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_edits', 'readonly');
    const store = tx.objectStore('pending_edits');
    const index = store.index('synced');
    const request = index.getAll(false);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const markEditSynced = async (id) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_edits', 'readwrite');
    const store = tx.objectStore('pending_edits');
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) { record.synced = true; store.put(record); }
      tx.oncomplete = () => resolve();
    };
    req.onerror = (e) => reject(e.target.error);
  });
};

export const cacheDoc = async (docId, content) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('cached_docs', 'readwrite');
    const store = tx.objectStore('cached_docs');
    store.put({ docId, content, cachedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getCachedDoc = async (docId) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('cached_docs', 'readonly');
    const store = tx.objectStore('cached_docs');
    const req = store.get(docId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
};

export const saveTaskUpdate = async (taskId, status, workspaceId) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_tasks', 'readwrite');
    const store = tx.objectStore('pending_tasks');
    store.add({ taskId, status, workspaceId, timestamp: Date.now(), synced: false });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingTasks = async () => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_tasks', 'readonly');
    const store = tx.objectStore('pending_tasks');
    const index = store.index('synced');
    const req = index.getAll(false);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
};

export const markTaskSynced = async (id) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('pending_tasks', 'readwrite');
    const store = tx.objectStore('pending_tasks');
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) { record.synced = true; store.put(record); }
      tx.oncomplete = () => resolve();
    };
    req.onerror = (e) => reject(e.target.error);
  });
};
