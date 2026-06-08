(() => {
  const form = document.getElementById('login-form'); // Formulaire de connexion.
  const emailInput = document.getElementById('email'); // Champ email.
  const passInput = document.getElementById('pass'); // Champ mot de passe.
  const rememberInput = document.getElementById('remember'); // Checkbox "Rester connecté".
  const errorBox = document.getElementById('login-error'); // Zone d'affichage des erreurs.

  function showError(message) {
    errorBox.textContent = message; // Affiche le message d'erreur.
    errorBox.hidden = false; // Rend visible la zone d'erreur.
  }

  function clearError() {
    errorBox.hidden = true; // Cache la zone d'erreur.
    errorBox.textContent = ''; // Vide le contenu d'erreur.
  }

  function redirectToHome() {
    window.location.href = '/'; // Redirige vers la page d'accueil.
  }

  document.addEventListener('DOMContentLoaded', () => {
    const existingToken = window.VisionixAuth?.getToken?.(); // Vérifie si un token existe déjà.
    if (existingToken) {
      redirectToHome(); // Si l'utilisateur est déjà connecté, on redirige.
      return;
    }

    if (!form) {
      return; // Si le formulaire n'existe pas, on arrête.
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault(); // Empêche le rechargement de la page.
      clearError();

      const email = emailInput.value.trim(); // Récupère l'email saisi.
      const pass = passInput.value; // Récupère le mot de passe saisi.
      const remember = rememberInput.checked; // Booléen pour le stockage du token.

      if (!email || !pass) {
        showError('Veuillez renseigner votre adresse email et votre mot de passe.');
        return; // Vérifie que tous les champs sont remplis.
      }

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, pass }), // Envoie l'email et le mot de passe au serveur.
        });

        const data = await response.json().catch(() => null); // Lit la réponse JSON.

        if (!response.ok || !data?.token) {
          throw new Error(data?.message || `Erreur ${response.status}`); // Si la connexion échoue.
        }

        window.VisionixAuth?.setToken?.(data.token, remember); // Stocke le token selon le choix de l'utilisateur.
        redirectToHome();
      } catch (error) {
        showError(error.message || 'Erreur lors de la connexion.'); // Affiche l'erreur.
      }
    });
  });
})();
