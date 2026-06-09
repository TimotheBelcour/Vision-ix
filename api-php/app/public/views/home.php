<?php
/* =====================================================================
 * views/home.php — Template HTML de la page "Défiez-moi" (accueil)
 * ---------------------------------------------------------------------
 * Ce fichier décrit la STRUCTURE de la page. Il est inclus par index.php
 * sur la route GET '/' (rendu via Slim). Il ne contient pas de logique :
 * tout le comportement dynamique est géré par /assets/js/app.js, et le
 * style par /assets/css/style.css.
 *
 * Zones importantes à repérer pour l'oral :
 *   - .upload-card : importer une image + bouton "Prendre une photo"
 *   - #camera-modal : fenêtre webcam (vidéo + bouton Capturer)
 *   - #btn-analyse : déclenche l'envoi à l'API
 *   - #result-card : bloc résultat IA + boutons de feedback Oui/Neutre/Non
 * ===================================================================== */
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vision-ix — Intelligence Gauloise</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/assets/css/style.css?v=3" />
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
        <a href="/" class="nav-link is-active">Défiez-moi</a>
        <a href="#" class="nav-link">Statistique</a>
        <a href="/historique" class="nav-link">Historique</a>
      </nav>
      <div class="nav-actions" id="nav-actions"></div>
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

    <!-- ZONE 1 : import d'image. La dropzone gère le clic ET le glisser-déposer.
         L'<input type="file"> est caché : on le déclenche via le bouton stylisé. -->
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

      <button type="button" class="btn btn-ghost" id="btn-camera">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Prendre une photo</span>
      </button>
      <p class="file-name" id="file-name" hidden></p>
    </section>

    <!-- ZONE 2 : modale webcam (cachée par défaut via l'attribut "hidden").
         <video> affiche le flux en direct, <canvas> sert à figer la photo.
         app.js ouvre/ferme cette modale et gère la capture. -->
    <div class="camera-modal" id="camera-modal" hidden role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
      <div class="camera-box">
        <div class="camera-box-header">
          <h3 id="camera-modal-title">Prendre une photo</h3>
          <button type="button" class="camera-close" id="camera-close" aria-label="Fermer">&times;</button>
        </div>
        <video id="camera-video" autoplay playsinline muted></video>
        <p class="camera-error" id="camera-error" hidden></p>
        <canvas id="camera-canvas" hidden></canvas>
        <div class="camera-box-footer">
          <button type="button" class="btn btn-capture" id="btn-capture" disabled>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
              <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
            </svg>
            Capturer
          </button>
        </div>
      </div>
    </div>

    <!-- ZONE 3 : bouton ANALYSER. Désactivé tant qu'aucune image n'est choisie.
         Au clic, app.js envoie l'image à POST /api/guesses. -->
    <button type="button" class="btn btn-analyse" id="btn-analyse" disabled>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>
      <span>ANALYSER</span>
    </button>

    <p class="login-note">Connectez-vous pour enregistrer vos prédictions et les retrouver dans l'historique.</p>

    <!-- ZONE 4 : bloc résultat IA (caché jusqu'à la réponse de l'API).
         Affiche l'image, la prédiction (Asterix/Obelix) et le feedback.
         aria-live="polite" = lecteurs d'écran annoncent le résultat. -->
    <section class="card result-card" id="result-card" hidden aria-live="polite">
      <h2 class="card-title result-title">Résultat IA</h2>
      <div class="result-image-wrap">
        <img id="result-image" class="result-image" alt="Image analysée" />
      </div>
      <p class="result-guess" id="result-guess"></p>

      <!-- ZONE 5 : feedback. L'attribut data-win porte la valeur envoyée à l'API :
           Oui=1, Neutre=0, Non=-1. app.js lit ce data-win au clic. -->
      <div class="feedback" id="feedback">
        <p class="feedback-question">Ce résultat est-il correct&nbsp;?</p>
        <div class="feedback-buttons" role="group" aria-label="Votre retour sur la prédiction">
          <button type="button" class="feedback-btn feedback-yes" data-win="1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M7 11v9H3v-9h4z"/>
              <path d="M7 11l4-8a2 2 0 0 1 3 2v5h5a2 2 0 0 1 2 2.3l-1.5 6A2 2 0 0 1 17.5 20H7"/>
            </svg>
            <span>Oui</span>
          </button>
          <button type="button" class="feedback-btn feedback-neutral" data-win="0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/>
              <line x1="8" y1="14" x2="16" y2="14"/>
              <circle cx="9" cy="10" r="0.8" fill="currentColor"/>
              <circle cx="15" cy="10" r="0.8" fill="currentColor"/>
            </svg>
            <span>Neutre</span>
          </button>
          <button type="button" class="feedback-btn feedback-no" data-win="-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 13V4h4v9h-4z"/>
              <path d="M17 13l-4 8a2 2 0 0 1-3-2v-5H5a2 2 0 0 1-2-2.3L4.5 5.7A2 2 0 0 1 6.5 4H17"/>
            </svg>
            <span>Non</span>
          </button>
        </div>
        <!-- Remplis dynamiquement par app.js après la réponse de l'API :
             message de remerciement + taux de réussite (zone 6). -->
        <p class="feedback-thanks" id="feedback-thanks" hidden>Merci pour votre retour</p>
        <p class="feedback-stats" id="feedback-stats" hidden></p>
      </div>
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

  <script src="/assets/js/auth.js" defer></script>
  <script src="/assets/js/app.js?v=3" defer></script>
</body>
</html>
