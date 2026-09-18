import ArchivesController from '../controllers/archives-controller';

class ArchivesScreen {
  async render() {
    return `
      <section class="archives-section container">
        <h1>Local Storage Vault Archives</h1>

        <div class="control-panel-bar">
          <div class="control-item">
            <label for="archive-search">Filter Archives:</label>
            <input type="text" id="archive-search" placeholder="Search archive title or summary..." aria-label="Search archives">
          </div>
          <div class="control-item">
            <label for="archive-sort">Sort Sequence:</label>
            <select id="archive-sort" aria-label="Sort archives">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
              <option value="name-desc">Alphabetical (Z-A)</option>
            </select>
          </div>
        </div>

        <div id="archives-stream" class="cards-stream"></div>
      </section>
    `;
  }

  async afterRender() {
    this._controller = new ArchivesController({ viewInstance: this });

    const searchBox = document.getElementById('archive-search');
    const sortDropdown = document.getElementById('archive-sort');

    const refreshStream = () => {
      this._controller.loadArchivedRecords({
        searchTerm: searchBox.value,
        sortCriteria: sortDropdown.value,
      });
    };

    searchBox.addEventListener('input', refreshStream);
    sortDropdown.addEventListener('change', refreshStream);

    await this._controller.loadArchivedRecords();
  }

  renderLoader() {
    const stream = document.getElementById('archives-stream');
    if (stream) stream.innerHTML = '<p>Accessing vault archives...</p>';
  }

  renderEmpty(msg = 'Vault is currently empty.') {
    const stream = document.getElementById('archives-stream');
    if (stream) stream.innerHTML = `<p class="status-alert">${msg}</p>`;
  }

  renderError(msg) {
    const stream = document.getElementById('archives-stream');
    if (stream) stream.innerHTML = `<p class="status-alert alert-error">${msg}</p>`;
  }

  renderArchivesGrid(recordCollection) {
    const stream = document.getElementById('archives-stream');
    if (!stream) return;
    stream.innerHTML = '';

    recordCollection.forEach((record) => {
      const cardArticle = document.createElement('article');
      cardArticle.classList.add('story-card-item');
      cardArticle.tabIndex = 0;

      cardArticle.innerHTML = `
        <img src="${record.photoUrl}" alt="Archive media by ${record.name}" class="card-visual">
        <div class="card-details">
          <h2 class="card-title-text">${record.name}</h2>
          <p class="card-timestamp">${new Date(record.createdAt).toLocaleDateString()}</p>
          <p class="card-excerpt">${record.description}</p>
          <div class="card-footer-action">
            <a href="#/detail/${record.id}" class="btn-core btn-glass btn-sm" aria-label="Inspect ${record.name}">Inspect</a>
            <button class="btn-core btn-crimson btn-sm purge-btn" data-id="${record.id}" aria-label="Purge ${record.name}">
              🗑️ Purge
            </button>
          </div>
        </div>
      `;

      cardArticle.querySelector('.purge-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._controller.purgeArchive(record.id);
      });

      stream.appendChild(cardArticle);
    });
  }

  onArchivePurged() {
    const searchBox = document.getElementById('archive-search');
    const sortDropdown = document.getElementById('archive-sort');
    this._controller.loadArchivedRecords({
      searchTerm: searchBox ? searchBox.value : '',
      sortCriteria: sortDropdown ? sortDropdown.value : 'newest',
    });
  }
}

export default ArchivesScreen;
