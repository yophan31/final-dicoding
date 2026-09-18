import NetworkConnector from '../data/api';
import AccessRegisterController from '../controllers/access-register-controller';

class AccessRegisterScreen {
  async render() {
    return `
      <section class="auth-wrapper">
        <h1>Register Node</h1>
        <form id="access-register-form">
          <div class="field-group">
            <label for="reg-name">Full Name</label>
            <input type="text" id="reg-name" required autocomplete="name">
          </div>
          <div class="field-group">
            <label for="reg-email">Email Address</label>
            <input type="email" id="reg-email" required autocomplete="email">
          </div>
          <div class="field-group">
            <label for="reg-password">Security Cipher</label>
            <input type="password" id="reg-password" required autocomplete="new-password" minlength="8">
          </div>
          <button type="submit" class="btn-core btn-cyan" style="width:100%;">Create Identity</button>
          <p style="margin-top:1.5rem; text-align:center;">Already authorized? <a href="#/login">Login here</a></p>
          <div id="register-alert-box" class="status-alert" style="display:none; margin-top:1rem;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._controller = new AccessRegisterController({ viewInstance: this, networkApi: NetworkConnector });

    this._formRef = document.getElementById('access-register-form');
    this._alertBox = document.getElementById('register-alert-box');
    this._submitButton = this._formRef.querySelector('button[type="submit"]');

    this._formRef.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = document.getElementById('reg-name').value;
      const emailVal = document.getElementById('reg-email').value;
      const passVal = document.getElementById('reg-password').value;
      this._controller.registerAccount(nameVal, emailVal, passVal);
    });
  }

  renderLoadingState() {
    if (this._submitButton) {
      this._submitButton.disabled = true;
      this._submitButton.textContent = 'Registering Identity...';
    }
    if (this._alertBox) {
      this._alertBox.style.display = 'none';
      this._alertBox.className = 'status-alert';
    }
  }

  renderErrorState(errorText) {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Create Identity';
    }
    if (this._alertBox) {
      this._alertBox.textContent = errorText;
      this._alertBox.className = 'status-alert alert-error';
      this._alertBox.style.display = 'block';
    }
  }

  renderSuccessState() {
    if (this._submitButton) {
      this._submitButton.disabled = false;
      this._submitButton.textContent = 'Create Identity';
    }
    if (this._alertBox) {
      this._alertBox.textContent = 'Node registration successful! Redirecting to login...';
      this._alertBox.className = 'status-alert alert-success';
      this._alertBox.style.display = 'block';
    }
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 2000);
  }
}

export default AccessRegisterScreen;
