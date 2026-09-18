import { DispatchQueueVault } from '../data/db';

class ComposerController {
  constructor({ viewInstance, networkApi }) {
    this._viewInstance = viewInstance;
    this._networkApi = networkApi;
  }

  async submitNewChronicle(narrativeText, mediaBlob, latCoord, lonCoord) {
    if (!mediaBlob) {
      this._viewInstance.renderFault('Media capture or upload required.');
      return;
    }

    this._viewInstance.renderProgress();

    if (!navigator.onLine) {
      await this._queueOfflineTransmission(narrativeText, mediaBlob, latCoord, lonCoord);
      return;
    }

    try {
      const response = await this._networkApi.transmitChronicle(narrativeText, mediaBlob, latCoord, lonCoord);
      if (response.error) {
        this._viewInstance.renderFault(response.message);
      } else {
        this._viewInstance.renderSuccess('Chronicle broadcasted successfully!');
      }
    } catch (networkErr) {
      console.warn('Network transmission failed, queueing offline:', networkErr);
      await this._queueOfflineTransmission(narrativeText, mediaBlob, latCoord, lonCoord);
    }
  }

  async _queueOfflineTransmission(narrativeText, mediaBlob, latCoord, lonCoord) {
    try {
      await DispatchQueueVault.enqueueTransmission({
        description: narrativeText,
        photo: mediaBlob,
        lat: latCoord ? parseFloat(latCoord) : null,
        lon: lonCoord ? parseFloat(lonCoord) : null,
        createdAt: new Date().toISOString(),
      });

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const swReg = await navigator.serviceWorker.ready;
        await swReg.sync.register('sync-new-stories');
      }

      this._viewInstance.renderOfflineSuccess();
    } catch (vaultErr) {
      console.error('Failed to queue offline transmission:', vaultErr);
      this._viewInstance.renderFault('Failed to store transmission in offline queue.');
    }
  }
}

export default ComposerController;
