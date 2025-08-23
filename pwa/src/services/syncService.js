import { apiService } from './apiService';
import { offlineStorage } from './offlineStorage';
import toast from 'react-hot-toast';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    console.log('App is online');
    this.syncPendingData();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('App is offline');
  }

  async syncPendingData() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting data sync...');

    try {
      const pendingRecords = await offlineStorage.getPendingRecords();
      
      if (pendingRecords.length === 0) {
        console.log('No pending records to sync');
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const record of pendingRecords) {
        try {
          // Remove image_file from record before sending to API
          const { image_file, ...recordData } = record;
          
          await apiService.submitCount(recordData);
          await offlineStorage.markRecordSynced(record.id);
          syncedCount++;
          
          console.log(`Synced record ${record.id}`);
        } catch (error) {
          console.error(`Failed to sync record ${record.id}:`, error);
          failedCount++;
        }
      }

      // Clean up synced records
      await offlineStorage.deleteSyncedRecords();

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} records successfully`);
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to sync ${failedCount} records`);
      }

      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
    } finally {
      this.syncInProgress = false;
    }
  }

  // Manual sync trigger
  async manualSync() {
    if (!this.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    await this.syncPendingData();
  }

  // Get sync status
  async getSyncStatus() {
    const usage = await offlineStorage.getStorageUsage();
    return {
      isOnline: this.isOnline,
      pendingRecords: usage.pendingRecords,
      syncInProgress: this.syncInProgress
    };
  }
}

export const syncService = new SyncService();
