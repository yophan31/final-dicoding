import SYSTEM_CONFIG from '../config';
import NetworkConnector from '../data/api';

const convertVapidKey = (keyString) => {
  const cleanedKey = keyString.trim();
  const padLength = '='.repeat((4 - (cleanedKey.length % 4)) % 4);
  const normalizedBase64 = (cleanedKey + padLength).replace(/-/g, '+').replace(/_/g, '/');
  const decodedRaw = window.atob(normalizedBase64);
  const uint8ArrayOut = new Uint8Array(decodedRaw.length);
  for (let idx = 0; idx < decodedRaw.length; ++idx) {
    uint8ArrayOut[idx] = decodedRaw.charCodeAt(idx);
  }
  return uint8ArrayOut;
};

let deferredInstallPrompt = null;

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker unavailable in current browser environment.');
    return;
  }

  try {
    const swRegistrationResult = await navigator.serviceWorker.register('./sw.js');
    swRegistrationResult.update();
    console.log('Service Worker registered successfully:', swRegistrationResult);

    window.addEventListener('beforeinstallprompt', (installEvent) => {
      installEvent.preventDefault();
      deferredInstallPrompt = installEvent;
      const pwaInstallButton = document.getElementById('install-btn');
      if (pwaInstallButton) {
        pwaInstallButton.style.display = 'inline-block';
        pwaInstallButton.addEventListener('click', async () => {
          pwaInstallButton.style.display = 'none';
          deferredInstallPrompt.prompt();
          const userChoiceOutcome = await deferredInstallPrompt.userChoice;
          console.log(`Installation prompt choice: ${userChoiceOutcome.outcome}`);
          deferredInstallPrompt = null;
        });
      }
    });

    return swRegistrationResult;
  } catch (err) {
    console.error('Service Worker registration encountered an error:', err);
  }
};

const initializePushManager = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notification framework not supported.');
    return;
  }

  const pushToggleButton = document.getElementById('push-toggle-btn');
  if (!pushToggleButton) return;

  const activeWorkerReg = await navigator.serviceWorker.ready;
  let activePushSub = await activeWorkerReg.pushManager.getSubscription();

  const refreshPushBtnUI = (isSubscribedState) => {
    if (isSubscribedState) {
      pushToggleButton.textContent = '🔕 Disable Push';
      pushToggleButton.setAttribute('aria-label', 'Disable Push Notifications');
      pushToggleButton.classList.add('active-state');
    } else {
      pushToggleButton.textContent = '🔔 Enable Push';
      pushToggleButton.setAttribute('aria-label', 'Enable Push Notifications');
      pushToggleButton.classList.remove('active-state');
    }
  };

  refreshPushBtnUI(!!activePushSub);

  pushToggleButton.onclick = async () => {
    try {
      pushToggleButton.disabled = true;
      activePushSub = await activeWorkerReg.pushManager.getSubscription();

      if (activePushSub) {
        await activePushSub.unsubscribe();
        await NetworkConnector.unregisterPushSubscription(activePushSub);
        refreshPushBtnUI(false);
        alert('Push notifications deactivated.');
      } else {
        const permissionResult = await Notification.requestPermission();
        if (permissionResult !== 'granted') {
          alert('Notification authorization was denied.');
          pushToggleButton.disabled = false;
          return;
        }

        const subscriptionOptions = {
          userVisibleOnly: true,
          applicationServerKey: convertVapidKey(SYSTEM_CONFIG.PUSH_PUBLIC_VAPID_KEY),
        };

        activePushSub = await activeWorkerReg.pushManager.subscribe(subscriptionOptions);
        const serializedSub = activePushSub.toJSON();

        await NetworkConnector.registerPushSubscription({
          endpoint: serializedSub.endpoint,
          keys: serializedSub.keys,
        });

        refreshPushBtnUI(true);
        alert('Successfully subscribed to push notifications!');

        activeWorkerReg.showNotification('ChronoGrid Nexus Alert', {
          body: 'Push notification channel successfully initialized!',
          icon: './icons/icon-192x192.png',
          badge: './favicon.png',
          data: { url: '/#/' },
        });
      }
    } catch (subscriptionErr) {
      console.error('Failed to update push subscription:', subscriptionErr);
      alert('Error updating push subscription: ' + subscriptionErr.message);
    } finally {
      pushToggleButton.disabled = false;
    }
  };
};

export { registerServiceWorker, initializePushManager };
