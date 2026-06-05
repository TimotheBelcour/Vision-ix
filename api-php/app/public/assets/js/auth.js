(() => {
  const TOKEN_KEY = 'visionixAuthToken';
  const navActions = document.getElementById('nav-actions');

  function getToken() {
    return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token, remember = true) {
    if (remember) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  function clearToken() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      return null;
    }
  }

  function updateNav() {
    if (!navActions) {
      return;
    }

    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      const username = payload?.data?.username || 'Utilisateur';
      navActions.innerHTML = `
        <span class="auth-label">Connecté : ${username}</span>
        <button id="logout-button" type="button" class="btn btn-ghost">Déconnexion</button>
      `;

      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => {
          clearToken();
          window.location.href = '/';
        });
      }
    } else {
      navActions.innerHTML = `<a href="/login" class="nav-link">Connexion</a>`;
    }
  }

  window.VisionixAuth = {
    getToken,
    setToken,
    clearToken,
    parseJwt,
  };

  document.addEventListener('DOMContentLoaded', updateNav);
})();
