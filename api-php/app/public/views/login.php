<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vision-ix — Connexion</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css" />
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand" aria-label="Vision-ix">
        <span class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16z"/>
            <circle cx="16" cy="16" r="4" fill="currentColor" stroke="none"/>
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-name">Vision-ix</span>
          <span class="brand-sub">INTELLIGENCE GAULOISE</span>
        </span>
      </a>

      <nav class="main-nav" aria-label="Navigation principale">
        <a href="/" class="nav-link">Défiez-moi</a>
        <a href="#" class="nav-link">Statistique</a>
        <a href="/historique" class="nav-link">Historique</a>
      </nav>
      <div class="nav-actions" id="nav-actions"></div>
    </div>
  </header>

  <main class="main container">
    <section class="card login-card" aria-labelledby="login-title">
      <h1 id="login-title" class="card-title">Connexion</h1>
      <p class="login-copy">Connectez-vous pour enregistrer vos analyses et consulter l'historique des prédictions.</p>

      <form id="login-form">
        <div class="form-group">
          <label for="email">Adresse email</label>
          <input id="email" name="email" type="email" required autocomplete="username" />
        </div>

        <div class="form-group">
          <label for="pass">Mot de passe</label>
          <input id="pass" name="pass" type="password" required autocomplete="current-password" />
        </div>

        <div class="form-group form-actions">
          <label class="checkbox">
            <input id="remember" name="remember" type="checkbox" checked />
            Rester connecté
          </label>
          <button type="submit" class="btn btn-primary">Se connecter</button>
        </div>
      </form>

      <div class="login-help" aria-live="polite">
        <p>Exemples de comptes disponibles :</p>
        <ul>
          <li><strong>asterix@irreductibles.fr</strong> / Le Plus Rapide &amp; Intelligent</li>
          <li><strong>obelix@irreductibles.fr</strong> / Pas Besoin de Potion Magique</li>
        </ul>
      </div>

      <div class="error-message" id="login-error" hidden role="alert"></div>
    </section>
  </main>

  <script src="/assets/js/auth.js" defer></script>
  <script src="/assets/js/login.js" defer></script>
</body>
</html>
