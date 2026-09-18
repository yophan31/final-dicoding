import { StorageVault } from '../data/db';

class FeedController {
  constructor({ viewComponent, dataConnector }) {
    this._viewComponent = viewComponent;
    this._dataConnector = dataConnector;
  }

  async fetchFeedData() {
    this._viewComponent.displayLoader();
    try {
      const responsePayload = await this._dataConnector.retrieveChronicles(1);
      if (!responsePayload.error) {
        if (responsePayload.listStory.length === 0) {
          this._viewComponent.displayEmptyState();
        } else {
          this._viewComponent.renderChroniclesFeed(responsePayload.listStory);
        }
      } else {
        this._viewComponent.displayFault(responsePayload.message);
      }
    } catch (networkErr) {
      console.warn('Cloud feed fetch failed, serving offline state:', networkErr);
      this._viewComponent.displayFault('Offline Mode: Unable to contact cloud server.');
    }
  }

  async toggleArchiveBookmark(chronicleObj, triggerButtonEl) {
    try {
      const existingArchive = await StorageVault.fetchArchive(chronicleObj.id);
      if (existingArchive) {
        await StorageVault.removeArchive(chronicleObj.id);
        triggerButtonEl.textContent = '🤍 Favorite';
        triggerButtonEl.classList.remove('btn-crimson');
        triggerButtonEl.classList.add('btn-glass');
      } else {
        await StorageVault.storeArchive(chronicleObj);
        triggerButtonEl.textContent = '❤️ Favorited';
        triggerButtonEl.classList.remove('btn-glass');
        triggerButtonEl.classList.add('btn-crimson');
      }
    } catch (vaultErr) {
      console.error('Failed to update archive storage:', vaultErr);
    }
  }
}

export default FeedController;
