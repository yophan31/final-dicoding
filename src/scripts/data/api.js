import SYSTEM_CONFIG from '../config';

const { ENDPOINT_ROOT } = SYSTEM_CONFIG;

class NetworkConnector {
  static fetchSessionToken() {
    return localStorage.getItem('nexus_auth_token');
  }

  static async registerAccount(fullname, userEmail, secretPass) {
    const serverResponse = await fetch(`${ENDPOINT_ROOT}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullname, email: userEmail, password: secretPass }),
    });
    return serverResponse.json();
  }

  static async authenticateUser(userEmail, secretPass) {
    const serverResponse = await fetch(`${ENDPOINT_ROOT}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: secretPass }),
    });
    const parsedData = await serverResponse.json();
    if (!parsedData.error && parsedData.loginResult) {
      localStorage.setItem('nexus_auth_token', parsedData.loginResult.token);
      localStorage.setItem('nexus_user_id', parsedData.loginResult.userId);
      localStorage.setItem('nexus_user_name', parsedData.loginResult.name);
    }
    return parsedData;
  }

  static terminateSession() {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_user_id');
    localStorage.removeItem('nexus_user_name');
  }

  static async retrieveChronicles(includeGeo = 1) {
    const authToken = this.fetchSessionToken();
    const serverResponse = await fetch(`${ENDPOINT_ROOT}/stories?location=${includeGeo}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return serverResponse.json();
  }

  static async retrieveChronicleDetail(uniqueId) {
    const authToken = this.fetchSessionToken();
    const serverResponse = await fetch(`${ENDPOINT_ROOT}/stories/${uniqueId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return serverResponse.json();
  }

  static async transmitChronicle(narrative, mediaFile, latitude, longitude) {
    const authToken = this.fetchSessionToken();
    const payloadForm = new FormData();
    payloadForm.append('description', narrative);
    payloadForm.append('photo', mediaFile);
    if (latitude) payloadForm.append('lat', latitude);
    if (longitude) payloadForm.append('lon', longitude);

    const serverResponse = await fetch(`${ENDPOINT_ROOT}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: payloadForm,
    });
    return serverResponse.json();
  }

  static async registerPushSubscription(pushSubPayload) {
    const authToken = this.fetchSessionToken();
    if (!authToken) return { error: true, message: 'Authentication required' };

    const serverResponse = await fetch(`${ENDPOINT_ROOT}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(pushSubPayload),
    });
    return serverResponse.json();
  }

  static async unregisterPushSubscription(pushSubPayload) {
    const authToken = this.fetchSessionToken();
    if (!authToken) return { error: true, message: 'Authentication required' };

    const serverResponse = await fetch(`${ENDPOINT_ROOT}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ endpoint: pushSubPayload ? pushSubPayload.endpoint : '' }),
    });
    return serverResponse.json();
  }
}

export default NetworkConnector;
