import RouteManifest from '../routes/routes';
import RouteResolver from '../routes/url-parser';
import NetworkConnector from '../data/api';
import { initializePushManager } from '../helpers/worker-initializer';

class ApplicationCoordinator {
  constructor({ menuTrigger, navigationDrawer, contentArea, navContainer }) {
    this.contentArea = contentArea;
    this.menuTrigger = menuTrigger;
    this.navigationDrawer = navigationDrawer;
    this.navContainer = navContainer;

    this._bindDrawerInteractions();
  }

  _bindDrawerInteractions() {
    if (this.menuTrigger) {
      this.menuTrigger.addEventListener('click', () => {
        this.navigationDrawer.classList.toggle('open');
      });

      document.body.addEventListener('click', (evt) => {
        if (!this.navigationDrawer.contains(evt.target) && !this.menuTrigger.contains(evt.target)) {
          this.navigationDrawer.classList.remove('open');
        }

        this.navigationDrawer.querySelectorAll('a').forEach((anchorNode) => {
          if (anchorNode.contains(evt.target)) {
            this.navigationDrawer.classList.remove('open');
          }
        });
      });
    }
  }

  _refreshNavigation() {
    const authenticated = !!NetworkConnector.fetchSessionToken();
    if (authenticated) {
      this.navContainer.innerHTML = `
        <li><a href="#/">Feed</a></li>
        <li><a href="#/add">Publish</a></li>
        <li><a href="#/favorite">Archives</a></li>
        <li><button id="push-toggle-btn" class="action-pill" aria-label="Toggle Push Alerts">🔔 Enable Push</button></li>
        <li><button id="install-btn" class="action-pill install-pill" style="display: none;" aria-label="Install App">📲 Install App</button></li>
        <li><a href="javascript:void(0)" id="session-logout-btn" role="button" aria-label="Terminate Session">Logout</a></li>
      `;
      const logoutTrigger = document.getElementById('session-logout-btn');
      if (logoutTrigger) {
        logoutTrigger.addEventListener('click', (e) => {
          e.preventDefault();
          NetworkConnector.terminateSession();
          window.location.hash = '#/login';
        });
      }
      initializePushManager();
    } else {
      this.navContainer.innerHTML = `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
        <li><button id="install-btn" class="action-pill install-pill" style="display: none;" aria-label="Install App">📲 Install App</button></li>
      `;
    }
  }

  async renderActiveScreen() {
    this._refreshNavigation();
    const routePattern = RouteResolver.decodeActiveHashWithPattern();

    const authenticated = !!NetworkConnector.fetchSessionToken();
    const unauthOnlyRoutes = ['/login', '/register'];
    if (!authenticated && !unauthOnlyRoutes.includes(routePattern)) {
      window.location.hash = '#/login';
      return;
    }
    if (authenticated && unauthOnlyRoutes.includes(routePattern)) {
      window.location.hash = '#/';
      return;
    }

    const targetScreenInstance = RouteManifest[routePattern] || RouteManifest['/'];

    const renderExecution = async () => {
      this.contentArea.innerHTML = await targetScreenInstance.render();
      if (targetScreenInstance.afterRender) {
        await targetScreenInstance.afterRender();
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => renderExecution());
    } else {
      await renderExecution();
    }
  }
}

export default ApplicationCoordinator;
