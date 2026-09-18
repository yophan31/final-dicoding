import FavoritePresenter from './favorite-presenter';

class FavoritePage {
  async render() {
    return `
      <section class="favorite-section container">
        <h1>Favorite Stories (IndexedDB)</h1>

        <!-- Interactive Controls (Filter, Search, Sort) for Skilled Requirement -->
        <div class="filter-controls">
          <div class="search-box">
            <label for="search-input">Search Stories:</label>
            <input type="text" id="search-input" placeholder="Search by name or description..." aria-label="Search stories">
          </div>
          <div class="sort-box">
            <label for="sort-select">Sort By:</label>
            <select id="sort-select" aria-label="Sort stories by">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        <div id="favorites-list" class="stories-container mt-2"></div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new FavoritePresenter({ view: this });

    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    const updateList = () => {
      this.presenter.loadFavorites({
        searchQuery: searchInput.value,
        sortBy: sortSelect.value,
      });
    };

    searchInput.addEventListener('input', updateList);
    sortSelect.addEventListener('change', updateList);

    await this.presenter.loadFavorites();
  }

  showLoading() {
    const listDiv = document.getElementById('favorites-list');
    if (listDiv) listDiv.innerHTML = '<p>Loading favorite stories...</p>';
  }

  showEmpty(message = 'No favorite stories saved yet.') {
    const listDiv = document.getElementById('favorites-list');
    if (listDiv) listDiv.innerHTML = `<p class="empty-message">${message}</p>`;
  }

  showError(message) {
    const listDiv = document.getElementById('favorites-list');
    if (listDiv) listDiv.innerHTML = `<p class="error-message">${message}</p>`;
  }

  showFavorites(stories) {
    const listDiv = document.getElementById('favorites-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    stories.forEach((story) => {
      const article = document.createElement('article');
      article.classList.add('story-item');
      article.tabIndex = 0;

      article.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-image">
        <div class="story-content">
          <h2 class="story-name">${story.name}</h2>
          <p class="story-date">${new Date(story.createdAt).toLocaleDateString()}</p>
          <p class="story-desc">${story.description}</p>
          <div class="card-actions">
            <a href="#/detail/${story.id}" class="btn btn-secondary btn-sm" aria-label="Detail story by ${story.name}">Detail</a>
            <button class="btn btn-danger btn-sm remove-fav-btn" data-id="${story.id}" aria-label="Remove ${story.name} from favorites">
              🗑️ Remove Favorite
            </button>
          </div>
        </div>
      `;

      article.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.presenter.removeFavorite(story.id);
      });

      listDiv.appendChild(article);
    });
  }

  onFavoriteRemoved() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    this.presenter.loadFavorites({
      searchQuery: searchInput ? searchInput.value : '',
      sortBy: sortSelect ? sortSelect.value : 'newest',
    });
  }
}

export default FavoritePage;
