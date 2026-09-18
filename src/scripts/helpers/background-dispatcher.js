import { DispatchQueueVault } from '../data/db';
import NetworkConnector from '../data/api';

const processQueuedTransmissions = async () => {
  if (!navigator.onLine) return;

  try {
    const pendingTransmissions = await DispatchQueueVault.fetchAllQueuedTransmissions();
    if (pendingTransmissions.length === 0) return;

    let syncedCount = 0;
    for (const record of pendingTransmissions) {
      try {
        const uploadResponse = await NetworkConnector.transmitChronicle(
          record.description,
          record.photo,
          record.lat,
          record.lon
        );
        if (!uploadResponse.error) {
          await DispatchQueueVault.removeQueuedTransmission(record.id);
          syncedCount++;
        }
      } catch (transmissionErr) {
        console.error('Failed syncing transmission ID:', record.id, transmissionErr);
      }
    }

    if (syncedCount > 0) {
      const syncNotice = `Synced ${syncedCount} offline chronicle(s) to the cloud!`;
      alert(syncNotice);

      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const swRegistration = await navigator.serviceWorker.ready;
        swRegistration.showNotification('Cloud Synchronization Complete', {
          body: syncNotice,
          icon: './icons/icon-192x192.png',
        });
      }

      if (window.location.hash === '#/' || window.location.hash === '') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  } catch (error) {
    console.error('Error during processQueuedTransmissions:', error);
  }
};

const activateBackgroundSyncMonitor = () => {
  window.addEventListener('online', () => {
    console.log('Network restored. Triggering offline sync dispatcher...');
    processQueuedTransmissions();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (incomingMsg) => {
      if (incomingMsg.data && incomingMsg.data.type === 'SYNC_OFFLINE_STORIES') {
        processQueuedTransmissions();
      }
    });
  }

  if (navigator.onLine) {
    processQueuedTransmissions();
  }
};

export { processQueuedTransmissions, activateBackgroundSyncMonitor };
