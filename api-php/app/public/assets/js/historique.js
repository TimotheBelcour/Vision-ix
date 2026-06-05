(() => {
  const state = {
    guesses: [],
    filteredGuesses: [],
    currentFilter: 'all',
    sortDescending: true,
    currentPage: 1,
    pageSize: 9,
  };

  const elements = {
    statsTotal: document.getElementById('stat-total'),
    statsAsterix: document.getElementById('stat-asterix'),
    statsObelix: document.getElementById('stat-obelix'),
    statsAverage: document.getElementById('stat-average'),
    filterButtons: Array.from(document.querySelectorAll('.btn-filter')),
    sortButton: document.getElementById('sort-button'),
    historyGrid: document.getElementById('history-grid'),
    pagination: document.getElementById('pagination'),
    emptyState: document.getElementById('empty-state'),
  };

  function getAuthToken() {
    return window.localStorage.getItem('visionixAuthToken') || window.sessionStorage.getItem('visionixAuthToken');
  }

  function formatDate(dateISO) {
    const date = new Date(dateISO);
    if (Number.isNaN(date.getTime())) return 'Date inconnue';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' • '
      + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function normalizeReliability(winValue) {
    if (winValue === null || winValue === undefined) return 0;
    const value = Number(winValue);
    if (value <= 1) return Math.round(Math.max(0, Math.min(1, value)) * 100);
    return Math.round(Math.max(0, Math.min(100, value)));
  }

  function getBadgeClass(guess) {
    return guess.toLowerCase().includes('asterix') ? 'badge-asterix' : 'badge-obelix';
  }

  const fallbackImage = 'https://via.placeholder.com/520x360/efe1c0/1a3d1f?text=Image+indisponible';

  function getImageUrl(path) {
    if (!path) return fallbackImage;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/')) return path;
    return fallbackImage;
  }

  function updateStats(guesses) {
    const total = guesses.length;
    const asterix = guesses.filter(item => item.guess && item.guess.toLowerCase().includes('asterix')).length;
    const obelix = guesses.filter(item => item.guess && item.guess.toLowerCase().includes('obelix')).length;
    const average = total === 0 ? 0 : Math.round(guesses.reduce((sum, item) => sum + normalizeReliability(item.win), 0) / total);

    elements.statsTotal.textContent = total;
    elements.statsAsterix.textContent = asterix;
    elements.statsObelix.textContent = obelix;
    elements.statsAverage.textContent = `${average}%`;
  }

  function getSortedGuesses(guesses) {
    return [...guesses].sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return state.sortDescending ? right - left : left - right;
    });
  }

  function applyFilter(filter) {
    state.currentFilter = filter;
    state.currentPage = 1;

    elements.filterButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.filter === filter);
    });

    state.filteredGuesses = state.guesses.filter(item => {
      if (filter === 'all') return true;
      return item.guess && item.guess.toLowerCase() === filter.toLowerCase();
    });

    renderHistory();
    updateStats(state.filteredGuesses);
  }

  function renderHistory() {
    const sorted = getSortedGuesses(state.filteredGuesses);
    const start = (state.currentPage - 1) * state.pageSize;
    const pageItems = sorted.slice(start, start + state.pageSize);

    elements.historyGrid.innerHTML = pageItems.map(item => {
      const reliability = normalizeReliability(item.win);
      const badgeClass = getBadgeClass(item.guess || '');
      const imageUrl = getImageUrl(item.imagepath || '');
      const title = item.guess || 'Prédiction inconnue';
      const dateText = formatDate(item.date || new Date().toISOString());

      return `
        <article class="history-card">
          <div class="card-image-wrap">
            <img src="${imageUrl}" alt="Prédiction ${title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}'" />
            <span class="status-badge ${badgeClass}">${title.toUpperCase()}</span>
            <span class="trust-badge">${reliability}% fiable</span>
          </div>
          <div class="card-body">
            <h2 class="card-name">${title}</h2>
            <div class="progress-bar">
              <span class="progress-filled" style="width: ${reliability}%;"></span>
            </div>
            <div class="progress-label">Fiabilité estimée</div>
          </div>
          <div class="card-footer">
            <span>${dateText}</span>
          </div>
        </article>
      `;
    }).join('');

    const hasItems = pageItems.length > 0;
    elements.emptyState.hidden = hasItems;
    elements.historyGrid.setAttribute('aria-busy', 'false');
    elements.historyGrid.style.display = hasItems ? 'grid' : 'none';

    renderPagination(sorted.length);
  }

  function renderPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
    const pages = [];

    const hasPrev = state.currentPage > 1;
    const hasNext = state.currentPage < totalPages;

    pages.push(`<button type="button" class="page-button" data-page="${Math.max(1, state.currentPage - 1)}" ${!hasPrev ? 'disabled' : ''}>PREC.</button>`);

    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(`<button type="button" class="page-button ${page === state.currentPage ? 'is-active' : ''}" data-page="${page}">${page}</button>`);
    }

    pages.push(`<button type="button" class="page-button" data-page="${Math.min(totalPages, state.currentPage + 1)}" ${!hasNext ? 'disabled' : ''}>SUIV.</button>`);

    elements.pagination.innerHTML = pages.join('');
    elements.pagination.querySelectorAll('.page-button').forEach(button => {
      button.addEventListener('click', () => {
        state.currentPage = Number(button.dataset.page);
        renderHistory();
      });
    });
  }

  async function fetchGuesses() {
    const token = getAuthToken();
    if (!token) {
      elements.historyGrid.innerHTML = '<p class="page-error">Jeton d\'authentification manquant. Veuillez vous reconnecter.</p>';
      return;
    }

    elements.historyGrid.setAttribute('aria-busy', 'true');
    elements.historyGrid.innerHTML = '<div class="loading-block">Chargement...</div>';

    try {
      const response = await fetch('/api/guesses', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        const message = error?.message || error?.error?.msg || `Erreur ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Réponse inattendue du serveur');
      }

      state.guesses = data;
      state.filteredGuesses = data;
      updateStats(state.filteredGuesses);
      renderHistory();
    } catch (error) {
      elements.historyGrid.innerHTML = `<p class="page-error">Impossible de charger l'historique : ${error.message}</p>`;
      elements.emptyState.hidden = true;
      elements.pagination.innerHTML = '';
    }
  }

  elements.filterButtons.forEach(button => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter));
  });

  elements.sortButton.addEventListener('click', () => {
    state.sortDescending = !state.sortDescending;
    elements.sortButton.textContent = state.sortDescending ? 'Plus récentes' : 'Plus anciennes';
    renderHistory();
  });

  document.addEventListener('DOMContentLoaded', fetchGuesses);
})();
