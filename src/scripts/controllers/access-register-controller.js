class AccessRegisterController {
  constructor({ viewInstance, networkApi }) {
    this._viewInstance = viewInstance;
    this._networkApi = networkApi;
  }

  async registerAccount(fullname, email, password) {
    this._viewInstance.renderLoadingState();
    try {
      const response = await this._networkApi.registerAccount(fullname, email, password);
      if (response.error) {
        this._viewInstance.renderErrorState(response.message);
      } else {
        this._viewInstance.renderSuccessState();
      }
    } catch (err) {
      this._viewInstance.renderErrorState('Network connection error during registration.');
    }
  }
}

export default AccessRegisterController;
