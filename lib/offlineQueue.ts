// Offline request queue using IndexedDB

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = "GymRavanaOfflineQueue";
const DB_VERSION = 1;
const STORE_NAME = "requests";

let db: IDBDatabase | null = null;

export const initOfflineQueue = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

export const queueRequest = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string
): Promise<void> => {
  if (!db) await initOfflineQueue();

  const request: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    method,
    headers,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const addRequest = store.add(request);

    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
  });
};

export const getQueuedRequests = async (): Promise<QueuedRequest[]> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
};

export const removeQueuedRequest = async (id: string): Promise<void> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};

export const retryQueuedRequests = async (): Promise<void> => {
  const requests = await getQueuedRequests();
  
  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await removeQueuedRequest(request.id);
        console.log("Successfully synced offline request:", request.id);
      }
    } catch (error) {
      console.error("Failed to sync offline request:", request.id, error);
      request.retryCount++;
      
      // Remove requests that have failed too many times
      if (request.retryCount >= 5) {
        await removeQueuedRequest(request.id);
        console.log("Removed failed request after 5 retries:", request.id);
      }
    }
  }
};

export const clearAllQueuedRequests = async (): Promise<void> => {
  if (!db) await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });
};
