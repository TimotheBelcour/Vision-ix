(() => {
  const TOKEN_KEY = 'visionixAuthToken'; // Clé utilisée pour stocker le token JWT.
  const navActions = document.getElementById('nav-actions'); // Emplacement de la zone d'actions dans l'en-tête.

  function getToken() {
    // Récupère le token JWT depuis localStorage ou sessionStorage.
    return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token, remember = true) {
    // Stocke le token selon l'option "rester connecté".
    if (remember) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  function clearToken() {
    // Supprime le token de tous les stockages possibles.
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1]; // Partie payload du JWT.
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload); // Retourne les données décodées du token.
    } catch (err) {
      return null; // Retourne null si le token est invalide.
    }
  }

  function updateNav() {
    if (!navActions) {
      return; // Si la zone de navigation n'existe pas, on ne fait rien.
    }

    const token = getToken();
    if (token) {
      const payload = parseJwt(token); // Décode le token pour afficher l'utilisateur.
      const username = payload?.data?.username || 'Utilisateur';
      navActions.innerHTML = `
        <span class="auth-label">Connecté : ${username}</span>
        <button id="logout-button" type="button" class="btn btn-ghost">Déconnexion</button>
      `;

      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => {
          clearToken(); // Supprime le token à la déconnexion.
          window.location.href = '/'; // Redirige vers l'accueil.
        });
      }
    } else {
      // Affiche le lien de connexion quand aucun token n'est présent.
      navActions.innerHTML = `<a href="/login" class="nav-link">Connexion</a>`;
    }
  }

  window.VisionixAuth = {
    getToken,
    setToken,
    clearToken,
    parseJwt,
  };

  document.addEventListener('DOMContentLoaded', updateNav); // Met à jour le menu au chargement de la page.
})();
