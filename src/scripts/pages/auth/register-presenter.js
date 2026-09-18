class RegisterPresenter {
  constructor({ view, api }) {
    this._view = view;
    this._api = api;
  }

  async register(name, email, password) {
    this._view.showLoading();
    try {
      const result = await this._api.register(name, email, password);
      if (result.error) {
        this._view.showError(result.message);
      } else {
        this._view.onRegisterSuccess();
      }
    } catch (error) {
      this._view.showError('Failed to connect to server.');
    }
  }
}

export default RegisterPresenter;