import DicodingStoryApi from '../../data/api';
import AddStoryPresenter from './add-story-presenter';
import L from 'leaflet';

class AddStoryPage {
  async render() {
    return `
      <section class="add-story-section container">
        <h1>Add New Story</h1>
        <form id="add-story-form">
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="4" required placeholder="Tuliskan cerita Anda..."></textarea>
          </div>

          <div class="form-group">
            <label for="photo">Photo (Upload or Capture)</label>
            <input type="file" id="photo" accept="image/*" class="mb-2">

            <!-- Camera Stream for Capture -->
            <div class="camera-controls">
              <button type="button" id="start-camera" class="btn btn-secondary">Open Camera</button>
              <button type="button" id="capture-photo" class="btn btn-secondary" style="display:none;">Capture Photo</button>
              <button type="button" id="stop-camera" class="btn btn-secondary" style="display:none;">Stop Camera</button>
            </div>
            <video id="camera-preview" autoplay style="display:none; max-width:100%; margin-top:10px; border-radius:8px;"></video>
            <canvas id="camera-canvas" style="display:none;"></canvas>

            <img id="photo-preview" src="" alt="Selected photo preview" style="display:none; max-width: 100%; margin-top: 10px; border-radius:8px;">
          </div>

          <div class="form-group">
            <label>Location (Click on map to select)</label>
            <div id="add-map" class="map" style="height: 250px;"></div>
            <div class="location-inputs mt-2">
              <label for="lat">Latitude:</label>
              <input type="number" id="lat" step="any" readonly>
              <label for="lon">Longitude:</label>
              <input type="number" id="lon" step="any" readonly>
            </div>
          </div>

          <button type="submit" class="btn btn-primary mt-2">Submit Story</button>
          <div id="add-message" class="message mt-2"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new AddStoryPresenter({ view: this, api: DicodingStoryApi });

    this.photoFile = null;
    this.mediaStream = null;

    this.form = document.getElementById('add-story-form');
    this.messageDiv = document.getElementById('add-message');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this._initMap();
    this._initPhotoInputs();

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const description = document.getElementById('description').value;
      const lat = document.getElementById('lat').value;
      const lon = document.getElementById('lon').value;
      this.presenter.addStory(description, this.photoFile, lat, lon);
    });

    window.addEventListener('hashchange', () => this._stopCamera(), { once: true });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Submitting...';
    this.messageDiv.textContent = '';
    this.messageDiv.className = 'message';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Submit Story';
    this.messageDiv.textContent = message;
    this.messageDiv.className = 'message error-message';
  }

  onSuccess(message = 'Story added successfully!') {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Submit Story';
    this.messageDiv.textContent = message;
    this.messageDiv.className = 'message success-message';
    setTimeout(() => {
      window.location.hash = '#/';
    }, 1500);
  }

  onOfflineSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Submit Story';
    this.messageDiv.textContent = '⚡ Disimpan offline di IndexedDB! Story akan otomatis dikirim saat internet terhubung kembali.';
    this.messageDiv.className = 'message success-message';
    setTimeout(() => {
      window.location.hash = '#/';
    }, 2000);
  }

  _initMap() {
    const map = L.map('add-map').setView([-6.200000, 106.816666], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    let marker;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat;
      document.getElementById('lon').value = lng;

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });
  }

  _initPhotoInputs() {
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.photoFile = file;
        this._stopCamera();
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = 'block';
      }
    });

    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const captureBtn = document.getElementById('capture-photo');
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');

    startCameraBtn.addEventListener('click', async () => {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = this.mediaStream;
        video.style.display = 'block';
        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'inline-block';
        captureBtn.style.display = 'inline-block';
        photoPreview.style.display = 'none';
      } catch (err) {
        alert('Kamera tidak dapat diakses atau ditolak.');
      }
    });

    stopCameraBtn.addEventListener('click', () => this._stopCamera());

    captureBtn.addEventListener('click', () => {
      if (this.mediaStream) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          this.photoFile = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          photoPreview.src = URL.createObjectURL(this.photoFile);
          photoPreview.style.display = 'block';
          this._stopCamera();
        }, 'image/jpeg');
      }
    });
  }

  _stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    const video = document.getElementById('camera-preview');
    const startBtn = document.getElementById('start-camera');
    const stopBtn = document.getElementById('stop-camera');
    const captureBtn = document.getElementById('capture-photo');
    if (video) video.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    if (captureBtn) captureBtn.style.display = 'none';
  }
}

export default AddStoryPage;
