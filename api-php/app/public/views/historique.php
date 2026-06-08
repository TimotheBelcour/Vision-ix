<!DOCTYPE html>
<html lang="fr">
<head>
  <!-- Déclaration du document HTML et de la langue -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vision-ix — Historique des prédictions</title>

  <!-- Chargement des polices et du fichier CSS -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/assets/css/style.css" />
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <!-- Logo et titre du site -->
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

      <!-- Navigation principale -->
      <nav class="main-nav" aria-label="Navigation principale">
        <a href="/" class="nav-link">Défiez-moi</a>
        <a href="#" class="nav-link">Statistique</a>
        <a href="/historique" class="nav-link is-active">Historique</a>
      </nav>
      <div class="nav-actions" id="nav-actions"></div>
    </div>
  </header>

  <main class="main container">
    <!-- En-tête de la page historique -->
    <section class="hero hero-history">
      <span class="hero-star" aria-hidden="true">&#9733;</span>
      <h1 class="hero-title">Historique des prédictions</h1>
      <p class="hero-subtitle">Toutes vos analyses classées par dates</p>
    </section>

    <!-- Indicateurs d'activité de l'historique -->
    <section class="stats-grid" aria-label="Compteurs de l'historique">
      <article class="stat-card">
        <span class="stat-label">TOTAL ANALYSES</span>
        <strong class="stat-value" id="stat-total">0</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">ASTÉRIX</span>
        <strong class="stat-value" id="stat-asterix">0</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">OBÉLIX</span>
        <strong class="stat-value" id="stat-obelix">0</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">FIABILITÉ MOY.</span>
        <strong class="stat-value" id="stat-average">0%</strong>
      </article>
    </section>

    <!-- Filtres et tri de l'historique -->
    <section class="filter-panel" aria-label="Filtres et tri">
      <div class="filter-group" role="tablist" aria-label="Filtrer les prédictions">
        <button class="btn btn-filter is-active" data-filter="all" type="button">TOUS</button>
        <button class="btn btn-filter" data-filter="Asterix" type="button">ASTÉRIX</button>
        <button class="btn btn-filter" data-filter="Obelix" type="button">OBÉLIX</button>
      </div>
      <button class="btn btn-secondary" id="sort-button" type="button">Plus récentes</button>
    </section>

    <!-- Grille des cartes d'historique -->
    <section class="history-section">
      <div id="history-grid" class="history-grid" aria-live="polite" aria-busy="true"></div>
      <div id="empty-state" class="empty-state" hidden>Aucune prédiction disponible pour ce filtre.</div>
      <div id="pagination" class="pagination" aria-label="Pagination des résultats"></div>
    </section>
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

  <!-- Scripts d'authentification et d'affichage de l'historique -->
  <script src="/assets/js/auth.js" defer></script>
  <script src="/assets/js/historique.js" defer></script>
</body>
</html>
