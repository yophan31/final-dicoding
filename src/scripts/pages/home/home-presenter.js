import { FavoriteStoryDb } from '../../data/db';

class HomePresenter {
  constructor({ view, api }) {
    this._view = view;
    this._api = api;
  }

  async loadStories() {
    this._view.showLoading();
    try {
      const response = await this._api.getStories(1);
      if (!response.error) {
        if (response.listStory.length === 0) {
          this._view.showEmpty();
        } else {
          this._view.showStories(response.listStory);
        }
      } else {
        this._view.showError(response.message);
      }
    } catch (error) {
      console.warn('Network request failed, attempting fallback to cached/IndexedDB stories:', error);
      this._view.showError('Offline Mode: Menampilkan data dari cache atau koneksi gagal.');
    }
  }

  async toggleFavorite(story, buttonElement) {
    try {
      const existing = await FavoriteStoryDb.getFavorite(story.id);
      if (existing) {
        await FavoriteStoryDb.deleteFavorite(story.id);
        buttonElement.textContent = '🤍 Favorite';
        buttonElement.classList.remove('btn-danger');
        buttonElement.classList.add('btn-secondary');
      } else {
        await FavoriteStoryDb.putFavorite(story);
        buttonElement.textContent = '❤️ Favorited';
        buttonElement.classList.remove('btn-secondary');
        buttonElement.classList.add('btn-danger');
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }
}

export default HomePresenter;
