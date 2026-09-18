import CONFIG from '../config';
import DicodingStoryApi from '../data/api';

const urlBase64ToUint8Array = (base64String) => {
  const sanitizedString = base64String.trim();
  const padding = '='.repeat((4 - (sanitizedString.length % 4)) % 4);
  const base64 = (sanitizedString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

let deferredPrompt = null;

const swRegister = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker is not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    registration.update();
    console.log('Service Worker registered successfully:', registration);

    // Setup Install Button Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.addEventListener('click', async () => {
          installBtn.style.display = 'none';
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User install choice: ${outcome}`);
          deferredPrompt = null;
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

const setupPushNotification = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notification is not supported.');
    return;
  }

  const pushBtn = document.getElementById('push-toggle-btn');
  if (!pushBtn) return;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  const updateButtonState = (isSubscribed) => {
    if (isSubscribed) {
      pushBtn.textContent = '🔕 Disable Push';
      pushBtn.setAttribute('aria-label', 'Disable Push Notifications');
      pushBtn.classList.add('btn-subscribed');
    } else {
      pushBtn.textContent = '🔔 Enable Push';
      pushBtn.setAttribute('aria-label', 'Enable Push Notifications');
      pushBtn.classList.remove('btn-subscribed');
    }
  };

  updateButtonState(!!subscription);

  pushBtn.onclick = async () => {
    try {
      pushBtn.disabled = true;
      subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe
        await subscription.unsubscribe();
        await DicodingStoryApi.unsubscribePushNotification(subscription);
        updateButtonState(false);
        alert('Push Notification disabled.');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied.');
          pushBtn.disabled = false;
          return;
        }

        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
        };

        subscription = await registration.pushManager.subscribe(subscribeOptions);

        // Format subscription JSON for API
        const subJson = subscription.toJSON();
        await DicodingStoryApi.subscribePushNotification({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        });

        updateButtonState(true);
        alert('Push Notification enabled successfully!');

        // Trigger local notification to demonstrate functionality immediately
        registration.showNotification('Dicoding Story Notification Active', {
          body: 'Anda berhasil berlangganan push notification!',
          icon: './icons/icon-192x192.png',
          badge: './favicon.png',
          data: { url: '/#/' },
        });
      }
    } catch (error) {
      console.error('Failed to toggle push notification subscription:', error);
      alert('Gagal mengatur push notification: ' + error.message);
    } finally {
      pushBtn.disabled = false;
    }
  };
};

export { swRegister, setupPushNotification };
