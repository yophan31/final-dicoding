import DicodingStoryApi from '../../data/api';
import HomePresenter from './home-presenter';
import { FavoriteStoryDb } from '../../data/db';
import L from 'leaflet';

L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

class HomePage {
  async render() {
    return `
      <section class="home-section">
        <div id="offline-banner" class="offline-banner" style="display: none;">
          ⚡ Anda sedang offline. Menampilkan data cerita yang tersimpan dalam cache.
        </div>

        <div class="home-header">
          <h1>Stories Map & Feed</h1>
          <div class="search-box">
            <input type="text" id="home-search" placeholder="Search stories..." aria-label="Search stories">
          </div>
        </div>

        <div class="home-container">
          <div class="map-container">
            <div id="map" class="map"></div>
          </div>
          <div class="stories-container" id="stories-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new HomePresenter({ view: this, api: DicodingStoryApi });

    this._checkOnlineStatus();
    window.addEventListener('online', () => this._checkOnlineStatus());
    window.addEventListener('offline', () => this._checkOnlineStatus());

    await this.presenter.loadStories();
  }

  _checkOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.style.display = navigator.onLine ? 'none' : 'block';
    }
  }

  showLoading() {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = '<p>Loading stories...</p>';
  }

  showEmpty() {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = '<p>No stories available.</p>';
  }

  showError(message) {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = `<p class="error-message">${message}</p>`;
  }

  async showStories(stories) {
    this._allStories = stories;
    this._renderMap(stories);
    await this._renderList(stories);

    const searchInput = document.getElementById('home-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = this._allStories.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query)
        );
        this._renderList(filtered);
      });
    }
  }

  _renderMap(stories) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const map = L.map('map').setView([-6.200000, 106.816666], 5);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap contributors',
    });

    osmLayer.addTo(map);

    const baseMaps = {
      'Street Map': osmLayer,
      'Topographic Map': topoLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    this.markers = {};

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 30)}...<br><a href="#/detail/${story.id}">Lihat Detail</a>`);
        this.markers[story.id] = marker;
      }
    });

    this.map = map;
  }

  async _renderList(stories) {
    const storiesListDiv = document.getElementById('stories-list');
    if (!storiesListDiv) return;
    storiesListDiv.innerHTML = '';

    const favoritesList = await FavoriteStoryDb.getAllFavorites();
    const favSet = new Set(favoritesList.map((f) => f.id));

    stories.forEach((story) => {
      const isFav = favSet.has(story.id);
      const storyElement = document.createElement('article');
      storyElement.classList.add('story-item');
      storyElement.tabIndex = 0;

      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-image">
        <div class="story-content">
          <div class="story-header-flex">
            <h2 class="story-name">${story.name}</h2>
            <button class="btn btn-sm ${isFav ? 'btn-danger' : 'btn-secondary'} fav-btn" data-id="${story.id}" aria-label="Bookmark ${story.name}">
              ${isFav ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
          </div>
          <p class="story-date">${new Date(story.createdAt).toLocaleDateString()}</p>
          <p class="story-desc">${story.description}</p>
          <a href="#/detail/${story.id}" class="detail-link mt-2">Read Detail &rarr;</a>
        </div>
      `;

      storyElement.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-btn') && !e.target.closest('.detail-link')) {
          this._focusMapOnStory(story);
        }
      });

      storyElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.fav-btn')) {
          this._focusMapOnStory(story);
        }
      });

      const favBtn = storyElement.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.presenter.toggleFavorite(story, favBtn);
      });

      storiesListDiv.appendChild(storyElement);
    });
  }

  _focusMapOnStory(story) {
    if (story.lat && story.lon && this.map && this.markers[story.id]) {
      this.map.flyTo([story.lat, story.lon], 12);
      this.markers[story.id].openPopup();
    }
  }
}

export default HomePage;
