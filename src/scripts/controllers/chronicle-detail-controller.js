import { StorageVault } from '../data/db';

class ChronicleDetailController {
  constructor({ viewInstance, networkApi, chronicleId }) {
    this._viewInstance = viewInstance;
    this._networkApi = networkApi;
    this._chronicleId = chronicleId;
  }

  async loadChronicleDetail() {
    this._viewInstance.renderLoader();
    try {
      let record = await StorageVault.fetchArchive(this._chronicleId);

      if (!record && navigator.onLine) {
        const apiResponse = await this._networkApi.retrieveChronicleDetail(this._chronicleId);
        if (!apiResponse.error && apiResponse.story) {
          record = apiResponse.story;
        }
      }

      if (record) {
        const isAlreadyArchived = !!(await StorageVault.fetchArchive(this._chronicleId));
        this._viewInstance.displayChronicleData(record, isAlreadyArchived);
      } else {
        this._viewInstance.displayError('Chronicle not found or offline restriction.');
      }
    } catch (err) {
      console.error('Failed to load chronicle detail:', err);
      this._viewInstance.displayError('Error loading chronicle information.');
    }
  }

  async toggleArchiveStatus(record) {
    try {
      const existing = await StorageVault.fetchArchive(record.id);
      if (existing) {
        await StorageVault.removeArchive(record.id);
        this._viewInstance.updateArchiveStateUI(false);
      } else {
        await StorageVault.storeArchive(record);
        this._viewInstance.updateArchiveStateUI(true);
      }
    } catch (error) {
      console.error('Error toggling archive status:', error);
      alert('Failed to modify archive status.');
    }
  }
}

export default ChronicleDetailController;
