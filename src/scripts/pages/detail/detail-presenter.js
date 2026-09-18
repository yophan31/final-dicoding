import { FavoriteStoryDb } from '../../data/db';

class DetailPresenter {
  constructor({ view, api, storyId }) {
    this._view = view;
    this._api = api;
    this._storyId = storyId;
  }

  async loadDetail() {
    this._view.showLoading();
    try {
      // First check local favorite database
      let story = await FavoriteStoryDb.getFavorite(this._storyId);

      if (!story && navigator.onLine) {
        const response = await this._api.getStoryDetail(this._storyId);
        if (!response.error && response.story) {
          story = response.story;
        }
      }

      if (story) {
        const isFavorited = !!(await FavoriteStoryDb.getFavorite(this._storyId));
        this._view.showStoryDetail(story, isFavorited);
      } else {
        this._view.showError('Story not found or device is offline.');
      }
    } catch (error) {
      console.error('Error loading story detail:', error);
      this._view.showError('Gagal memuat detail story.');
    }
  }

  async toggleFavorite(story) {
    try {
      const existing = await FavoriteStoryDb.getFavorite(story.id);
      if (existing) {
        await FavoriteStoryDb.deleteFavorite(story.id);
        this._view.updateFavoriteState(false);
      } else {
        await FavoriteStoryDb.putFavorite(story);
        this._view.updateFavoriteState(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Gagal mengubah status favorit.');
    }
  }
}

export default DetailPresenter;
