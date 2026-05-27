(() => {
  const dropzone      = document.getElementById('dropzone');
  const fileInput     = document.getElementById('file-input');
  const btnChoose     = document.getElementById('btn-choose');
  const btnCamera     = document.getElementById('btn-camera');
  const btnAnalyse    = document.getElementById('btn-analyse');
  const fileName      = document.getElementById('file-name');
  const cameraNotice  = document.getElementById('camera-notice');
  const resultCard    = document.getElementById('result-card');
  const resultImage   = document.getElementById('result-image');
  const resultGuess   = document.getElementById('result-guess');
  const errorMessage  = document.getElementById('error-message');

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const state = {
    currentFile: null,
    currentGuessId: null,
  };

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
    errorMessage.textContent = '';
  }

  function setFile(file) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Format non supporté. Utilisez une image JPG, JPEG ou PNG.');
      return;
    }
    clearError();
    state.currentFile = file;
    state.currentGuessId = null;
    fileName.hidden = false;
    fileName.textContent = `Image sélectionnée : ${file.name}`;
    btnAnalyse.disabled = false;
    resultCard.hidden = true;
  }

  btnChoose.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    setFile(e.target.files[0]);
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    setFile(file);
  });

  // Bouton "Prendre une photo" — fonctionnalité à venir
  let cameraNoticeTimer = null;
  btnCamera.addEventListener('click', () => {
    cameraNotice.hidden = false;
    if (cameraNoticeTimer) clearTimeout(cameraNoticeTimer);
    cameraNoticeTimer = setTimeout(() => {
      cameraNotice.hidden = true;
    }, 2500);
  });

  // ANALYSER : envoi à POST /api/guesses
  btnAnalyse.addEventListener('click', async () => {
    if (!state.currentFile) return;
    clearError();

    const formData = new FormData();
    formData.append('guessimage', state.currentFile);

    btnAnalyse.disabled = true;
    btnAnalyse.classList.add('is-loading');

    try {
      const res = await fetch('/api/guesses', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.guess) {
        const msg = (data && data.message) ? data.message : `Erreur ${res.status}`;
        throw new Error(msg);
      }

      state.currentGuessId = data.id;
      resultImage.src = URL.createObjectURL(state.currentFile);
      resultImage.alt = `Image analysée — ${data.guess}`;
      resultGuess.textContent = data.guess;
      resultCard.dataset.guessId = String(data.id);
      resultCard.hidden = false;
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(`Analyse impossible : ${err.message}`);
    } finally {
      btnAnalyse.classList.remove('is-loading');
      btnAnalyse.disabled = false;
    }
  });
})();
