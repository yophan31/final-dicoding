import NetworkConnector from '../data/api';
import FeedController from '../controllers/feed-controller';
import { StorageVault } from '../data/db';
import L from 'leaflet';

L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

class FeedScreen {
  async render() {
    return `
      <section class="feed-section">
        <div id="offline-network-banner" class="offline-banner" style="display: none;">
          ⚡ Network offline. Displaying cached vault chronicles.
        </div>

        <div class="feed-header">
          <h1>Chronicles Feed & Geo-Grid</h1>
          <div class="search-field">
            <input type="text" id="feed-search-input" placeholder="Search chronicles..." aria-label="Search stories">
          </div>
        </div>

        <div class="feed-grid-layout">
          <div class="map-node-wrapper">
            <div id="interactive-map" class="interactive-map"></div>
          </div>
          <div class="cards-stream" id="chronicles-stream"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._controller = new FeedController({ viewComponent: this, dataConnector: NetworkConnector });

    this._evaluateConnectivity();
    window.addEventListener('online', () => this._evaluateConnectivity());
    window.addEventListener('offline', () => this._evaluateConnectivity());

    await this._controller.fetchFeedData();
  }

  _evaluateConnectivity() {
    const bannerEl = document.getElementById('offline-network-banner');
    if (bannerEl) {
      bannerEl.style.display = navigator.onLine ? 'none' : 'block';
    }
  }

  displayLoader() {
    const streamContainer = document.getElementById('chronicles-stream');
    if (streamContainer) streamContainer.innerHTML = '<p>Loading chronicles...</p>';
  }

  displayEmptyState() {
    const streamContainer = document.getElementById('chronicles-stream');
    if (streamContainer) streamContainer.innerHTML = '<p>No chronicles found in the matrix.</p>';
  }

  displayFault(errorMsg) {
    const streamContainer = document.getElementById('chronicles-stream');
    if (streamContainer) streamContainer.innerHTML = `<p class="status-alert alert-error">${errorMsg}</p>`;
  }

  async renderChroniclesFeed(recordArray) {
    this._masterRecords = recordArray;
    this._buildGeoMap(recordArray);
    await this._renderCardsList(recordArray);

    const searchInput = document.getElementById('feed-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (evt) => {
        const queryTerm = evt.target.value.toLowerCase().trim();
        const filteredRecords = this._masterRecords.filter(
          (rec) =>
            rec.name.toLowerCase().includes(queryTerm) ||
            rec.description.toLowerCase().includes(queryTerm)
        );
        this._renderCardsList(filteredRecords);
      });
    }
  }

  _buildGeoMap(recordArray) {
    const mapDomNode = document.getElementById('interactive-map');
    if (!mapDomNode) return;

    const leafletInstance = L.map('interactive-map').setView([-6.200000, 106.816666], 5);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap contributors',
    });

    streetLayer.addTo(leafletInstance);

    const mapStyles = {
      'Street Grid': streetLayer,
      'Topographic Grid': topoLayer,
    };

    L.control.layers(mapStyles).addTo(leafletInstance);

    this._markerDictionary = {};

    recordArray.forEach((record) => {
      if (record.lat && record.lon) {
        const geoMarker = L.marker([record.lat, record.lon]).addTo(leafletInstance);
        geoMarker.bindPopup(`<b>${record.name}</b><br>${record.description.substring(0, 35)}...<br><a href="#/detail/${record.id}">Inspect Details</a>`);
        this._markerDictionary[record.id] = geoMarker;
      }
    });

    this._leafletMap = leafletInstance;
  }

  async _renderCardsList(recordArray) {
    const streamContainer = document.getElementById('chronicles-stream');
    if (!streamContainer) return;
    streamContainer.innerHTML = '';

    const archiveCollection = await StorageVault.fetchAllArchives();
    const archivedIdsSet = new Set(archiveCollection.map((arch) => arch.id));

    recordArray.forEach((record) => {
      const isArchived = archivedIdsSet.has(record.id);
      const articleNode = document.createElement('article');
      articleNode.classList.add('story-card-item');
      articleNode.tabIndex = 0;

      articleNode.innerHTML = `
        <img src="${record.photoUrl}" alt="Chronicle media by ${record.name}" class="card-visual">
        <div class="card-details">
          <div class="card-header-row">
            <h2 class="card-title-text">${record.name}</h2>
            <button class="btn-core btn-sm ${isArchived ? 'btn-crimson' : 'btn-glass'} bookmark-trigger" data-id="${record.id}" aria-label="Bookmark ${record.name}">
              ${isArchived ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
          </div>
          <p class="card-timestamp">${new Date(record.createdAt).toLocaleDateString()}</p>
          <p class="card-excerpt">${record.description}</p>
          <div class="card-footer-action">
            <a href="#/detail/${record.id}" class="btn-core btn-cyan btn-sm">Inspect &rarr;</a>
          </div>
        </div>
      `;

      articleNode.addEventListener('click', (e) => {
        if (!e.target.closest('.bookmark-trigger') && !e.target.closest('a')) {
          this._repositionMap(record);
        }
      });

      articleNode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.bookmark-trigger')) {
          this._repositionMap(record);
        }
      });

      const bookmarkBtn = articleNode.querySelector('.bookmark-trigger');
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._controller.toggleArchiveBookmark(record, bookmarkBtn);
      });

      streamContainer.appendChild(articleNode);
    });
  }

  _repositionMap(record) {
    if (record.lat && record.lon && this._leafletMap && this._markerDictionary[record.id]) {
      this._leafletMap.flyTo([record.lat, record.lon], 12);
      this._markerDictionary[record.id].openPopup();
    }
  }
}

export default FeedScreen;
