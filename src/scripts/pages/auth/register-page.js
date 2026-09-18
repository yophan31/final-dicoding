import DicodingStoryApi from '../../data/api';
import RegisterPresenter from './register-presenter';

class RegisterPage {
  async render() {
    return `
      <section class="auth-section">
        <h1>Register</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="new-password" minlength="8">
          </div>
          <button type="submit" class="btn btn-primary">Register</button>
          <p class="mt-2">Already have an account? <a href="#/login">Login</a></p>
          <div id="register-message" class="message"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new RegisterPresenter({ view: this, api: DicodingStoryApi });

    this.form = document.getElementById('register-form');
    this.messageDiv = document.getElementById('register-message');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.presenter.register(name, email, password);
    });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Registering...';
    this.messageDiv.textContent = '';
    this.messageDiv.className = 'message';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Register';
    this.messageDiv.textContent = message;
    this.messageDiv.classList.add('error-message');
  }

  onRegisterSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Register';
    this.messageDiv.textContent = 'Registration successful! Please login.';
    this.messageDiv.classList.add('success-message');
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 2000);
  }
}

export default RegisterPage;