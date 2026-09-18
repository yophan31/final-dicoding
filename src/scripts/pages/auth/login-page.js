import DicodingStoryApi from '../../data/api';
import LoginPresenter from './login-presenter';

class LoginPage {
  async render() {
    return `
      <section class="auth-section">
        <h1>Login</h1>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="current-password" minlength="8">
          </div>
          <button type="submit" class="btn btn-primary">Login</button>
          <p class="mt-2">Don't have an account? <a href="#/register">Register</a></p>
          <div id="login-error" class="error-message"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new LoginPresenter({ view: this, api: DicodingStoryApi });

    this.form = document.getElementById('login-form');
    this.errorDiv = document.getElementById('login-error');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.presenter.login(email, password);
    });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Logging in...';
    this.errorDiv.textContent = '';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Login';
    this.errorDiv.textContent = message;
  }

  onLoginSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Login';
    window.location.hash = '#/';
  }
}

export default LoginPage;