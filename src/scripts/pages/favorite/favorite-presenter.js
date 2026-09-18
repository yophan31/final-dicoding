import { FavoriteStoryDb } from '../../data/db';

class FavoritePresenter {
  constructor({ view }) {
    this._view = view;
  }

  async loadFavorites({ searchQuery = '', sortBy = 'newest' } = {}) {
    this._view.showLoading();
    try {
      let favorites = await FavoriteStoryDb.getAllFavorites();

      if (!favorites || favorites.length === 0) {
        this._view.showEmpty();
        return;
      }

      // 1. Filter Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        favorites = favorites.filter(
          (story) =>
            (story.name && story.name.toLowerCase().includes(query)) ||
            (story.description && story.description.toLowerCase().includes(query))
        );
      }

      // 2. Sort Interactive
      favorites.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortBy === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });

      if (favorites.length === 0) {
        this._view.showEmpty('No favorite stories match your search criteria.');
      } else {
        this._view.showFavorites(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites from IndexedDB:', error);
      this._view.showError('Gagal memuat cerita favorit dari IndexedDB.');
    }
  }

  async removeFavorite(id) {
    try {
      await FavoriteStoryDb.deleteFavorite(id);
      this._view.onFavoriteRemoved();
    } catch (error) {
      console.error('Error deleting favorite:', error);
      alert('Gagal menghapus dari favorit.');
    }
  }
}

export default FavoritePresenter;
