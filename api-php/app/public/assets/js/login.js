(() => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('pass');
  const rememberInput = document.getElementById('remember');
  const errorBox = document.getElementById('login-error');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function redirectToHome() {
    window.location.href = '/';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const existingToken = window.VisionixAuth?.getToken?.();
    if (existingToken) {
      redirectToHome();
      return;
    }

    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearError();

      const email = emailInput.value.trim();
      const pass = passInput.value;
      const remember = rememberInput.checked;

      if (!email || !pass) {
        showError('Veuillez renseigner votre adresse email et votre mot de passe.');
        return;
      }

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, pass }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.token) {
          throw new Error(data?.message || `Erreur ${response.status}`);
        }

        window.VisionixAuth?.setToken?.(data.token, remember);
        redirectToHome();
      } catch (error) {
        showError(error.message || 'Erreur lors de la connexion.');
      }
    });
  });
})();
