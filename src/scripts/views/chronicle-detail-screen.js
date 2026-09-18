import NetworkConnector from '../data/api';
import ChronicleDetailController from '../controllers/chronicle-detail-controller';
import RouteResolver from '../routes/url-parser';
import L from 'leaflet';

class ChronicleDetailScreen {
  async render() {
    return `
      <section class="chronicle-section container">
        <a href="#/" class="btn-core btn-glass mb-2">&larr; Return to Feed</a>
        <div id="chronicle-detail-viewport"></div>
      </section>
    `;
  }

  async afterRender() {
    const activeRouteData = RouteResolver.decodeActiveHashRaw();
    this._targetId = activeRouteData.identifierSegment;

    this._controller = new ChronicleDetailController({
      viewInstance: this,
      networkApi: NetworkConnector,
      chronicleId: this._targetId,
    });

    await this._controller.loadChronicleDetail();
  }

  renderLoader() {
    const viewport = document.getElementById('chronicle-detail-viewport');
    if (viewport) viewport.innerHTML = '<p>Loading chronicle specifications...</p>';
  }

  displayError(errorMessage) {
    const viewport = document.getElementById('chronicle-detail-viewport');
    if (viewport) viewport.innerHTML = `<p class="status-alert alert-error">${errorMessage}</p>`;
  }

  displayChronicleData(record, isArchived) {
    this._activeRecord = record;
    const viewport = document.getElementById('chronicle-detail-viewport');
    if (!viewport) return;

    viewport.innerHTML = `
      <article class="chronicle-node-card">
        <img src="${record.photoUrl}" alt="Chronicle media by ${record.name}" class="chronicle-hero-img">
        <div class="chronicle-inner-body">
          <div class="chronicle-top-flex">
            <div>
              <h1 class="chronicle-heading">${record.name}</h1>
              <p class="card-timestamp">${new Date(record.createdAt).toLocaleString()}</p>
            </div>
            <button id="archive-toggle-btn" class="btn-core ${isArchived ? 'btn-crimson' : 'btn-cyan'}" aria-label="${isArchived ? 'Remove from archives' : 'Add to archives'}">
              ${isArchived ? '❤️ Favorited' : '🤍 Add to Archives'}
            </button>
          </div>
          <p class="chronicle-prose">${record.description}</p>
          ${
            record.lat && record.lon
              ? `<div class="mt-2">
                  <h3>Geo Coordinates</h3>
                  <div id="chronicle-detail-map" class="interactive-map" style="height: 320px; margin-top: 10px;"></div>
                 </div>`
              : ''
          }
        </div>
      </article>
    `;

    const archiveBtn = document.getElementById('archive-toggle-btn');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', () => {
        this._controller.toggleArchiveStatus(this._activeRecord);
      });
    }

    if (record.lat && record.lon) {
      setTimeout(() => {
        const detailMap = L.map('chronicle-detail-map').setView([record.lat, record.lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(detailMap);
        L.marker([record.lat, record.lon])
          .addTo(detailMap)
          .bindPopup(`<b>${record.name}</b><br>${record.description.substring(0, 45)}...`)
          .openPopup();
      }, 120);
    }
  }

  updateArchiveStateUI(isArchived) {
    const archiveBtn = document.getElementById('archive-toggle-btn');
    if (archiveBtn) {
      archiveBtn.className = `btn-core ${isArchived ? 'btn-crimson' : 'btn-cyan'}`;
      archiveBtn.textContent = isArchived ? '❤️ Favorited' : '🤍 Add to Archives';
      archiveBtn.setAttribute('aria-label', isArchived ? 'Remove from archives' : 'Add to archives');
    }
  }
}

export default ChronicleDetailScreen;
