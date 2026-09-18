import { StorageVault } from '../data/db';

class ArchivesController {
  constructor({ viewInstance }) {
    this._viewInstance = viewInstance;
  }

  async loadArchivedRecords({ searchTerm = '', sortCriteria = 'newest' } = {}) {
    this._viewInstance.renderLoader();
    try {
      let archivesList = await StorageVault.fetchAllArchives();

      if (!archivesList || archivesList.length === 0) {
        this._viewInstance.renderEmpty();
        return;
      }

      if (searchTerm.trim()) {
        const keyword = searchTerm.toLowerCase().trim();
        archivesList = archivesList.filter(
          (item) =>
            (item.name && item.name.toLowerCase().includes(keyword)) ||
            (item.description && item.description.toLowerCase().includes(keyword))
        );
      }

      archivesList.sort((a, b) => {
        if (sortCriteria === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortCriteria === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortCriteria === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (sortCriteria === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });

      if (archivesList.length === 0) {
        this._viewInstance.renderEmpty('No archives match the query parameters.');
      } else {
        this._viewInstance.renderArchivesGrid(archivesList);
      }
    } catch (err) {
      console.error('Error fetching archives from vault:', err);
      this._viewInstance.renderError('Failed to load local archives.');
    }
  }

  async purgeArchive(recordId) {
    try {
      await StorageVault.removeArchive(recordId);
      this._viewInstance.onArchivePurged();
    } catch (err) {
      console.error('Error purging archive:', err);
      alert('Failed to delete archive entry.');
    }
  }
}

export default ArchivesController;
