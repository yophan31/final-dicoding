import NetworkConnector from '../data/api';
import ComposerController from '../controllers/composer-controller';
import L from 'leaflet';

class ComposerScreen {
  async render() {
    return `
      <section class="composer-wrapper">
        <h1>Publish New Chronicle</h1>
        <form id="composer-form">
          <div class="field-group">
            <label for="narrative">Chronicle Narrative</label>
            <textarea id="narrative" rows="4" required placeholder="Type your narrative here..."></textarea>
          </div>

          <div class="field-group">
            <label for="media-input">Media Asset (Upload or Capture)</label>
            <input type="file" id="media-input" accept="image/*" class="mb-2" style="margin-bottom: 12px; display:block;">

            <div class="camera-controls" style="display:flex; gap:10px; margin-bottom:10px;">
              <button type="button" id="init-cam-btn" class="btn-core btn-glass btn-sm">Launch Optic</button>
              <button type="button" id="capture-cam-btn" class="btn-core btn-cyan btn-sm" style="display:none;">Capture Frame</button>
              <button type="button" id="halt-cam-btn" class="btn-core btn-crimson btn-sm" style="display:none;">Halt Optic</button>
            </div>
            <video id="optic-stream-view" autoplay style="display:none; width:100%; border-radius:8px; margin-top:8px;"></video>
            <canvas id="optic-snapshot-canvas" style="display:none;"></canvas>
            <img id="media-preview-box" src="" alt="Media preview" style="display:none; width:100%; border-radius:8px; margin-top:8px;">
          </div>

          <div class="field-group">
            <label>Geospatial Location (Select on Grid)</label>
            <div id="composer-map-view" class="interactive-map" style="height: 240px; border-radius: 8px;"></div>
            <div style="display:flex; gap:10px; margin-top:10px;">
              <div style="flex:1;">
                <label for="lat-val">Latitude:</label>
                <input type="number" id="lat-val" step="any" readonly>
              </div>
              <div style="flex:1;">
                <label for="lon-val">Longitude:</label>
                <input type="number" id="lon-val" step="any" readonly>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-core btn-cyan" style="width:100%; margin-top:1rem;">Transmit Chronicle</button>
          <div id="composer-status-msg" class="status-alert" style="display:none; margin-top:1rem;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._controller = new ComposerController({ viewInstance: this, networkApi: NetworkConnector });

    this._selectedMediaBlob = null;
    this._cameraStreamRef = null;

    this._formEl = document.getElementById('composer-form');
    this._statusDiv = document.getElementById('composer-status-msg');
    this._submitButton = this._formEl.querySelector('button[type="submit"]');

    this._setupGridMap();
    this._setupMediaHandlers();

    this._formEl.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const narrativeText = document.getElementById('narrative').value;
      const latitude = document.getElementById('lat-val').value;
      const longitude = document.getElementById('lon-val').value;
      this._controller.submitNewChronicle(narrativeText, this._selectedMediaBlob, latitude, longitude);
    });

    window.addEventListener('hashchange', () => this._terminateOpticStream(), { once: true });
  }

  renderProgress() {
    if (this._submitButton) {
      this._submitButton.disabled = true;
      this._submitButton.textContent = 'Transmitting...';
    }
    if (this._statusDiv) {
      this._statusDiv.style.display = 'none';
    }
  }

  renderFault(errorMessage) {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Transmit Chronicle';
    }
    if (this._statusDiv) {
      this._statusDiv.textContent = errorMessage;
      this._statusDiv.className = 'status-alert alert-error';
      this._statusDiv.style.display = 'block';
    }
  }

  renderSuccess(successMessage = 'Transmission broadcasted successfully!') {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Transmit Chronicle';
    }
    if (this._statusDiv) {
      this._statusDiv.textContent = successMessage;
      this._statusDiv.className = 'status-alert alert-success';
      this._statusDiv.style.display = 'block';
    }
    setTimeout(() => {
      window.location.hash = '#/';
    }, 1500);
  }

  renderOfflineSuccess() {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Transmit Chronicle';
    }
    if (this._statusDiv) {
      this._statusDiv.textContent = '⚡ Cached in vault! Transmission will automatically dispatch when cloud connectivity is restored.';
      this._statusDiv.className = 'status-alert alert-success';
      this._statusDiv.style.display = 'block';
    }
    setTimeout(() => {
      window.location.hash = '#/';
    }, 2000);
  }

  _setupGridMap() {
    const mapInstance = L.map('composer-map-view').setView([-6.200000, 106.816666], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance);

    let activePin;

    mapInstance.on('click', (clickEvt) => {
      const { lat, lng } = clickEvt.latlng;
      document.getElementById('lat-val').value = lat;
      document.getElementById('lon-val').value = lng;

      if (activePin) {
        activePin.setLatLng(clickEvt.latlng);
      } else {
        activePin = L.marker(clickEvt.latlng).addTo(mapInstance);
      }
    });
  }

  _setupMediaHandlers() {
    const fileInput = document.getElementById('media-input');
    const previewImg = document.getElementById('media-preview-box');

    fileInput.addEventListener('change', (e) => {
      const fileObj = e.target.files[0];
      if (fileObj) {
        this._selectedMediaBlob = fileObj;
        this._terminateOpticStream();
        previewImg.src = URL.createObjectURL(fileObj);
        previewImg.style.display = 'block';
      }
    });

    const launchBtn = document.getElementById('init-cam-btn');
    const haltBtn = document.getElementById('halt-cam-btn');
    const captureBtn = document.getElementById('capture-cam-btn');
    const videoNode = document.getElementById('optic-stream-view');
    const canvasNode = document.getElementById('optic-snapshot-canvas');

    launchBtn.addEventListener('click', async () => {
      try {
        this._cameraStreamRef = await navigator.mediaDevices.getUserMedia({ video: true });
        videoNode.srcObject = this._cameraStreamRef;
        videoNode.style.display = 'block';
        launchBtn.style.display = 'none';
        haltBtn.style.display = 'inline-flex';
        captureBtn.style.display = 'inline-flex';
        previewImg.style.display = 'none';
      } catch (err) {
        alert('Camera hardware access denied or unavailable.');
      }
    });

    haltBtn.addEventListener('click', () => this._terminateOpticStream());

    captureBtn.addEventListener('click', () => {
      if (this._cameraStreamRef) {
        canvasNode.width = videoNode.videoWidth;
        canvasNode.height = videoNode.videoHeight;
        canvasNode.getContext('2d').drawImage(videoNode, 0, 0, canvasNode.width, canvasNode.height);

        canvasNode.toBlob((blobResult) => {
          this._selectedMediaBlob = new File([blobResult], 'optic-capture.jpg', { type: 'image/jpeg' });
          previewImg.src = URL.createObjectURL(this._selectedMediaBlob);
          previewImg.style.display = 'block';
          this._terminateOpticStream();
        }, 'image/jpeg');
      }
    });
  }

  _terminateOpticStream() {
    if (this._cameraStreamRef) {
      this._cameraStreamRef.getTracks().forEach((trk) => trk.stop());
      this._cameraStreamRef = null;
    }
    const videoNode = document.getElementById('optic-stream-view');
    const launchBtn = document.getElementById('init-cam-btn');
    const haltBtn = document.getElementById('halt-cam-btn');
    const captureBtn = document.getElementById('capture-cam-btn');
    if (videoNode) videoNode.style.display = 'none';
    if (launchBtn) launchBtn.style.display = 'inline-flex';
    if (haltBtn) haltBtn.style.display = 'none';
    if (captureBtn) captureBtn.style.display = 'none';
  }
}

export default ComposerScreen;
