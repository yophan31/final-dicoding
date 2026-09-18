import NetworkConnector from '../data/api';
import AccessLoginController from '../controllers/access-login-controller';

class AccessLoginScreen {
  async render() {
    return `
      <section class="auth-wrapper">
        <h1>Nexus Authentication</h1>
        <form id="access-login-form">
          <div class="field-group">
            <label for="user-email">Email Address</label>
            <input type="email" id="user-email" required autocomplete="email">
          </div>
          <div class="field-group">
            <label for="user-password">Security Cipher</label>
            <input type="password" id="user-password" required autocomplete="current-password" minlength="8">
          </div>
          <button type="submit" class="btn-core btn-cyan" style="width:100%;">Authorize Access</button>
          <p style="margin-top:1.5rem; text-align:center;">Need a credential pass? <a href="#/register">Register node</a></p>
          <div id="login-alert-box" class="status-alert alert-error" style="display:none; margin-top:1rem;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._controller = new AccessLoginController({ viewInstance: this, networkApi: NetworkConnector });

    this._formRef = document.getElementById('access-login-form');
    this._alertBox = document.getElementById('login-alert-box');
    this._submitButton = this._formRef.querySelector('button[type="submit"]');

    this._formRef.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('user-email').value;
      const passwordInput = document.getElementById('user-password').value;
      this._controller.authenticate(emailInput, passwordInput);
    });
  }

  renderLoadingState() {
    if (this._submitButton) {
      this._submitButton.disabled = true;
      this._submitButton.textContent = 'Authenticating...';
    }
    if (this._alertBox) {
      this._alertBox.style.display = 'none';
    }
  }

  renderErrorState(errorText) {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Authorize Access';
    }
    if (this._alertBox) {
      this._alertBox.textContent = errorText;
      this._alertBox.style.display = 'block';
    }
  }

  renderSuccessState() {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Authorize Access';
    }
    window.location.hash = '#/';
  }
}

export default AccessLoginScreen;
