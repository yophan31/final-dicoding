import DicodingStoryApi from '../../data/api';
import DetailPresenter from './detail-presenter';
import UrlParser from '../../routes/url-parser';
import L from 'leaflet';

class DetailPage {
  async render() {
    return `
      <section class="detail-section container">
        <a href="#/" class="btn btn-secondary mb-2">&larr; Back to Home</a>
        <div id="detail-content" class="detail-content"></div>
      </section>
    `;
  }

  async afterRender() {
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    this.storyId = url.id;

    this.presenter = new DetailPresenter({
      view: this,
      api: DicodingStoryApi,
      storyId: this.storyId,
    });

    await this.presenter.loadDetail();
  }

  showLoading() {
    const content = document.getElementById('detail-content');
    if (content) content.innerHTML = '<p>Loading story details...</p>';
  }

  showError(message) {
    const content = document.getElementById('detail-content');
    if (content) content.innerHTML = `<p class="error-message">${message}</p>`;
  }

  showStoryDetail(story, isFavorited) {
    this.story = story;
    const content = document.getElementById('detail-content');
    if (!content) return;

    content.innerHTML = `
      <article class="detail-card">
        <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="detail-image">
        <div class="detail-body">
          <div class="detail-header">
            <div>
              <h1 class="detail-title">${story.name}</h1>
              <p class="detail-date">${new Date(story.createdAt).toLocaleString()}</p>
            </div>
            <button id="fav-toggle-btn" class="btn ${isFavorited ? 'btn-danger' : 'btn-primary'}" aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </button>
          </div>
          <p class="detail-desc">${story.description}</p>
          ${
            story.lat && story.lon
              ? `<div class="detail-map-wrapper mt-2">
                  <h3>Story Location</h3>
                  <div id="detail-map" class="map" style="height: 300px;"></div>
                 </div>`
              : ''
          }
        </div>
      </article>
    `;

    const favBtn = document.getElementById('fav-toggle-btn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        this.presenter.toggleFavorite(this.story);
      });
    }

    if (story.lat && story.lon) {
      setTimeout(() => {
        const map = L.map('detail-map').setView([story.lat, story.lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        L.marker([story.lat, story.lon])
          .addTo(map)
          .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 40)}...`)
          .openPopup();
      }, 100);
    }
  }

  updateFavoriteState(isFavorited) {
    const favBtn = document.getElementById('fav-toggle-btn');
    if (favBtn) {
      favBtn.className = `btn ${isFavorited ? 'btn-danger' : 'btn-primary'}`;
      favBtn.textContent = isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites';
      favBtn.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');
    }
  }
}

export default DetailPage;
