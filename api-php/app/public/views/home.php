<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vision-ix — Intelligence Gauloise</title>

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
        <a href="#" class="nav-link is-active">Défiez-moi</a>
        <a href="#" class="nav-link">Statistique</a>
        <a href="#" class="nav-link">Historique</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-inner">
      <span class="hero-star" aria-hidden="true">&#9733;</span>
      <h1 class="hero-title">Qui se cache derrière cette image&nbsp;?</h1>
      <p class="hero-subtitle">NOTRE IA RECONNAÎT CHAQUE HÉROS DU VILLAGE GAULOIS</p>
    </div>
  </section>

  <main class="main container">

    <section class="card upload-card" aria-labelledby="upload-title">
      <h2 id="upload-title" class="card-title">Importer votre image</h2>

      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Glissez-déposez une image ou cliquez pour en choisir une">
        <svg class="dropzone-icon" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 44h24a10 10 0 0 0 2-19.8A14 14 0 0 0 18 22a9 9 0 0 0 2 22z"/>
          <path d="M32 38V22"/>
          <path d="M25 29l7-7 7 7"/>
        </svg>

        <p class="dropzone-text">
          Glissez-déposez une image<br />
          ou utilisez votre caméra
        </p>

        <button type="button" class="btn btn-primary" id="btn-choose">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3v12"/>
            <path d="M7 8l5-5 5 5"/>
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
          </svg>
          <span>CHOISIR UNE IMAGE</span>
        </button>

        <input type="file" id="file-input" accept="image/jpeg,image/jpg,image/png" hidden />
      </div>

      <div class="divider"><span>ou</span></div>

      <button type="button" class="btn btn-ghost" id="btn-camera" aria-describedby="camera-notice">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Prendre une photo</span>
      </button>
      <p id="camera-notice" class="camera-notice" hidden role="status">Fonction caméra à venir</p>

      <p class="file-name" id="file-name" hidden></p>
    </section>

    <button type="button" class="btn btn-analyse" id="btn-analyse" disabled>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>
      <span>ANALYSER</span>
    </button>

    <section class="card result-card" id="result-card" hidden aria-live="polite">
      <h2 class="card-title result-title">Résultat IA</h2>
      <div class="result-image-wrap">
        <img id="result-image" class="result-image" alt="Image analysée" />
      </div>
      <p class="result-guess" id="result-guess"></p>
    </section>

    <div class="error-message" id="error-message" hidden role="alert"></div>

  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span class="brand-logo footer-logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16z"/>
          <circle cx="16" cy="16" r="4" fill="currentColor" stroke="none"/>
        </svg>
      </span>
      <span class="footer-name">Vision-ix</span>
      <span class="footer-star">&#9733;</span>
      <span class="footer-tag">INTELLIGENCE GAULOISE</span>
      <span class="footer-meta">PROJET BUT INFORMATIQUE · 2026</span>
    </div>
  </footer>

  <script src="/assets/js/app.js" defer></script>
</body>
</html>
