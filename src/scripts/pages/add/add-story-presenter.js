import { OfflineStoryDb } from '../../data/db';

class AddStoryPresenter {
  constructor({ view, api }) {
    this._view = view;
    this._api = api;
  }

  async addStory(description, photoFile, lat, lon) {
    if (!photoFile) {
      this._view.showError('Standard upload: Tolong pilih atau ambil foto terlebih dahulu.');
      return;
    }

    this._view.showLoading();

    // Check if offline first
    if (!navigator.onLine) {
      await this._saveOffline(description, photoFile, lat, lon);
      return;
    }

    try {
      const result = await this._api.addStory(description, photoFile, lat, lon);
      if (result.error) {
        this._view.showError(result.message);
      } else {
        this._view.onSuccess('Story berhasil diunggah!');
      }
    } catch (error) {
      console.warn('Network error while adding story, saving offline to IndexedDB:', error);
      await this._saveOffline(description, photoFile, lat, lon);
    }
  }

  async _saveOffline(description, photoFile, lat, lon) {
    try {
      await OfflineStoryDb.addOfflineStory({
        description,
        photo: photoFile,
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null,
        createdAt: new Date().toISOString(),
      });

      // Register background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-new-stories');
      }

      this._view.onOfflineSuccess();
    } catch (dbError) {
      console.error('Error saving offline story to IndexedDB:', dbError);
      this._view.showError('Gagal menyimpan cerita ke IndexedDB.');
    }
  }
}

export default AddStoryPresenter;
