import { openDB } from 'idb';

const DB_NAME = 'PillCounterDB';
const DB_VERSION = 1;
const STORES = {
  PENDING_RECORDS: 'pendingRecords',
  SYNC_QUEUE: 'syncQueue'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create pending records store
          if (!db.objectStoreNames.contains(STORES.PENDING_RECORDS)) {
            const pendingStore = db.createObjectStore(STORES.PENDING_RECORDS, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
            pendingStore.createIndex('synced', 'synced', { unique: false });
          }

          // Create sync queue store
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            syncStore.createIndex('type', 'type', { unique: false });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  // Store pending pill count record
  async storePendingRecord(record) {
    if (!this.db) await this.init();
    
    const pendingRecord = {
      ...record,
      timestamp: Date.now(),
      synced: false
    };

    try {
      const id = await this.db.add(STORES.PENDING_RECORDS, pendingRecord);
      console.log('Stored pending record with ID:', id);
      return id;
    } catch (error) {
      console.error('Failed to store pending record:', error);
      throw error;
    }
  }

  // Get all pending records
  async getPendingRecords() {
    if (!this.db) await this.init();
    
    try {
      const records = await this.db.getAllFromIndex(
        STORES.PENDING_RECORDS, 
        'synced', 
        false
      );
      return records;
    } catch (error) {
      console.error('Failed to get pending records:', error);
      return [];
    }
  }

  // Mark record as synced
  async markRecordSynced(id) {
    if (!this.db) await this.init();
    
    try {
      const record = await this.db.get(STORES.PENDING_RECORDS, id);
      if (record) {
        record.synced = true;
        await this.db.put(STORES.PENDING_RECORDS, record);
      }
    } catch (error) {
      console.error('Failed to mark record as synced:', error);
    }
  }

  // Delete synced records
  async deleteSyncedRecords() {
    if (!this.db) await this.init();
    
    try {
      const syncedRecords = await this.db.getAllFromIndex(
        STORES.PENDING_RECORDS, 
        'synced', 
        true
      );
      
      for (const record of syncedRecords) {
        await this.db.delete(STORES.PENDING_RECORDS, record.id);
      }
    } catch (error) {
      console.error('Failed to delete synced records:', error);
    }
  }

  // Add to sync queue
  async addToSyncQueue(item) {
    if (!this.db) await this.init();
    
    const queueItem = {
      ...item,
      timestamp: Date.now()
    };

    try {
      const id = await this.db.add(STORES.SYNC_QUEUE, queueItem);
      return id;
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      throw error;
    }
  }

  // Get sync queue items
  async getSyncQueue() {
    if (!this.db) await this.init();
    
    try {
      const items = await this.db.getAll(STORES.SYNC_QUEUE);
      return items.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  // Remove from sync queue
  async removeFromSyncQueue(id) {
    if (!this.db) await this.init();
    
    try {
      await this.db.delete(STORES.SYNC_QUEUE, id);
    } catch (error) {
      console.error('Failed to remove from sync queue:', error);
    }
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Get storage usage
  async getStorageUsage() {
    if (!this.db) await this.init();
    
    try {
      const pendingCount = await this.db.count(STORES.PENDING_RECORDS);
      const queueCount = await this.db.count(STORES.SYNC_QUEUE);
      
      return {
        pendingRecords: pendingCount,
        syncQueueItems: queueCount
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { pendingRecords: 0, syncQueueItems: 0 };
    }
  }
}

export const offlineStorage = new OfflineStorage();
