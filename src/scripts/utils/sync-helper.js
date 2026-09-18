import { OfflineStoryDb } from '../data/db';
import DicodingStoryApi from '../data/api';

const syncOfflineStories = async () => {
  if (!navigator.onLine) return;

  try {
    const offlineStories = await OfflineStoryDb.getAllOfflineStories();
    if (offlineStories.length === 0) return;

    let successCount = 0;
    for (const story of offlineStories) {
      try {
        const result = await DicodingStoryApi.addStory(
          story.description,
          story.photo,
          story.lat,
          story.lon
        );
        if (!result.error) {
          await OfflineStoryDb.deleteOfflineStory(story.id);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to sync offline story ID:', story.id, err);
      }
    }

    if (successCount > 0) {
      const message = `Berhasil menyinkronkan ${successCount} cerita offline ke server!`;
      alert(message);

      // Trigger notification if supported
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Sinkronisasi Offline Berhasil', {
          body: message,
          icon: './icons/icon-192x192.png',
        });
      }

      // If user is currently on home page, reload hash to refresh stories
      if (window.location.hash === '#/' || window.location.hash === '') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  } catch (error) {
    console.error('Error in syncOfflineStories:', error);
  }
};

const initOfflineSyncListener = () => {
  window.addEventListener('online', () => {
    console.log('Network connected! Syncing offline stories...');
    syncOfflineStories();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_OFFLINE_STORIES') {
        syncOfflineStories();
      }
    });
  }

  // Initial check on load
  if (navigator.onLine) {
    syncOfflineStories();
  }
};

export { syncOfflineStories, initOfflineSyncListener };
