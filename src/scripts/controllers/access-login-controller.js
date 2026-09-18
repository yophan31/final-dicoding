class AccessLoginController {
  constructor({ viewInstance, networkApi }) {
    this._viewInstance = viewInstance;
    this._networkApi = networkApi;
  }

  async authenticate(userEmail, secretPass) {
    this._viewInstance.renderLoadingState();
    try {
      const response = await this._networkApi.authenticateUser(userEmail, secretPass);
      if (response.error) {
        this._viewInstance.renderErrorState(response.message);
      } else {
        this._viewInstance.renderSuccessState();
      }
    } catch (err) {
      this._viewInstance.renderErrorState('Network connection error during authentication.');
    }
  }
}

export default AccessLoginController;
