// A pure, robust IndexedDB storage wrapper for heavy base64 assets (documents, certifications, resumes)
class HeavyStorage {
  private dbName = 'nexus_heavy_storage';
  private storeName = 'files';
  private db: IDBDatabase | null = null;
  private isInitializing = false;
  private initPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        this.isInitializing = false;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitializing = false;
        resolve(request.result);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  async set(key: string, val: any): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const txn = db.transaction(this.storeName, 'readwrite');
        const store = txn.objectStore(this.storeName);
        const req = store.put(val, key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
          console.error("IndexedDB put req failed:", e);
          resolve(false);
        };
      });
    } catch (e) {
      console.error("IndexedDB write failed:", e);
      return false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const txn = db.transaction(this.storeName, 'readonly');
        const store = txn.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => {
          console.error("IndexedDB get req failed, returning null:", e);
          resolve(null);
        };
      });
    } catch (e) {
      console.error("IndexedDB read failed, returning null:", e);
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const txn = db.transaction(this.storeName, 'readwrite');
        const store = txn.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
          console.error("IndexedDB delete req failed:", e);
          resolve(false);
        };
      });
    } catch (e) {
      console.error("IndexedDB delete failed:", e);
      return false;
    }
  }
}

export const heavyStorage = new HeavyStorage();
