class LoginPresenter {
  constructor({ view, api }) {
    this._view = view;
    this._api = api;
  }

  async login(email, password) {
    this._view.showLoading();
    try {
      const result = await this._api.login(email, password);
      if (result.error) {
        this._view.showError(result.message);
      } else {
        this._view.onLoginSuccess();
      }
    } catch (error) {
      this._view.showError('Failed to connect to server.');
    }
  }
}

export default LoginPresenter;