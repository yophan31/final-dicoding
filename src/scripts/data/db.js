import SYSTEM_CONFIG from '../config';

const { VAULT_DB_IDENTIFIER, VAULT_DB_SCHEMA_VERSION, VAULT_STORE_ARCHIVES, VAULT_STORE_DISPATCH_QUEUE } = SYSTEM_CONFIG;

const establishVaultConnection = () => {
  return new Promise((resolveConnection, rejectConnection) => {
    const dbOpenReq = indexedDB.open(VAULT_DB_IDENTIFIER, VAULT_DB_SCHEMA_VERSION);

    dbOpenReq.onupgradeneeded = (evt) => {
      const activeDatabase = evt.target.result;
      if (!activeDatabase.objectStoreNames.contains(VAULT_STORE_ARCHIVES)) {
        activeDatabase.createObjectStore(VAULT_STORE_ARCHIVES, { keyPath: 'id' });
      }
      if (!activeDatabase.objectStoreNames.contains(VAULT_STORE_DISPATCH_QUEUE)) {
        activeDatabase.createObjectStore(VAULT_STORE_DISPATCH_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    dbOpenReq.onsuccess = (evt) => resolveConnection(evt.target.result);
    dbOpenReq.onerror = (evt) => rejectConnection(evt.target.error);
  });
};

const StorageVault = {
  async fetchArchive(targetId) {
    if (!targetId) return null;
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_ARCHIVES, 'readonly');
      const storeRef = txn.objectStore(VAULT_STORE_ARCHIVES);
      const queryReq = storeRef.get(targetId);
      queryReq.onsuccess = () => resolveOp(queryReq.result || null);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },

  async fetchAllArchives() {
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_ARCHIVES, 'readonly');
      const storeRef = txn.objectStore(VAULT_STORE_ARCHIVES);
      const queryReq = storeRef.getAll();
      queryReq.onsuccess = () => resolveOp(queryReq.result || []);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },

  async storeArchive(chronicleRecord) {
    if (!chronicleRecord || !chronicleRecord.id) return;
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_ARCHIVES, 'readwrite');
      const storeRef = txn.objectStore(VAULT_STORE_ARCHIVES);
      const queryReq = storeRef.put(chronicleRecord);
      queryReq.onsuccess = () => resolveOp(queryReq.result);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },

  async removeArchive(targetId) {
    if (!targetId) return;
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_ARCHIVES, 'readwrite');
      const storeRef = txn.objectStore(VAULT_STORE_ARCHIVES);
      const queryReq = storeRef.delete(targetId);
      queryReq.onsuccess = () => resolveOp(queryReq.result);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },
};

const DispatchQueueVault = {
  async enqueueTransmission(transmissionData) {
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_DISPATCH_QUEUE, 'readwrite');
      const storeRef = txn.objectStore(VAULT_STORE_DISPATCH_QUEUE);
      const queryReq = storeRef.add(transmissionData);
      queryReq.onsuccess = () => resolveOp(queryReq.result);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },

  async fetchAllQueuedTransmissions() {
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_DISPATCH_QUEUE, 'readonly');
      const storeRef = txn.objectStore(VAULT_STORE_DISPATCH_QUEUE);
      const queryReq = storeRef.getAll();
      queryReq.onsuccess = () => resolveOp(queryReq.result || []);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },

  async removeQueuedTransmission(queueId) {
    const dbInstance = await establishVaultConnection();
    return new Promise((resolveOp, rejectOp) => {
      const txn = dbInstance.transaction(VAULT_STORE_DISPATCH_QUEUE, 'readwrite');
      const storeRef = txn.objectStore(VAULT_STORE_DISPATCH_QUEUE);
      const queryReq = storeRef.delete(queueId);
      queryReq.onsuccess = () => resolveOp(queryReq.result);
      queryReq.onerror = () => rejectOp(queryReq.error);
    });
  },
};

export { StorageVault, DispatchQueueVault };
