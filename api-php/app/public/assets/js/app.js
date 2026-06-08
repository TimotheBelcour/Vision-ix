(() => {
  const dropzone      = document.getElementById('dropzone');
  const fileInput     = document.getElementById('file-input');
  const btnChoose     = document.getElementById('btn-choose');
  const btnCamera     = document.getElementById('btn-camera');
  const btnAnalyse    = document.getElementById('btn-analyse');
  const fileName      = document.getElementById('file-name');
  const resultCard    = document.getElementById('result-card');
  const resultImage   = document.getElementById('result-image');
  const resultGuess   = document.getElementById('result-guess');
  const errorMessage  = document.getElementById('error-message');
  const feedbackBtns  = document.querySelectorAll('.feedback-btn');
  const feedbackThanks= document.getElementById('feedback-thanks');
  const feedbackStats = document.getElementById('feedback-stats');

  // Webcam
  const cameraModal   = document.getElementById('camera-modal');
  const cameraVideo   = document.getElementById('camera-video');
  const cameraCanvas  = document.getElementById('camera-canvas');
  const cameraError   = document.getElementById('camera-error');
  const cameraClose   = document.getElementById('camera-close');
  const btnCapture    = document.getElementById('btn-capture');

  let mediaStream = null;

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const state = {
    currentFile: null,
    currentGuessId: null,
  };

  function getAuthToken() {
    return window.localStorage.getItem('visionixAuthToken') || window.sessionStorage.getItem('visionixAuthToken');
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
    errorMessage.textContent = '';
  }

  function resetFeedback() {
    feedbackBtns.forEach(b => {
      b.disabled = false;
      b.classList.remove('is-selected');
    });
    feedbackThanks.hidden = true;
    feedbackStats.hidden = true;
    feedbackStats.textContent = '';
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
    resetFeedback();
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

  function stopStream() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(function(t) { t.stop(); });
      mediaStream = null;
    }
    cameraVideo.srcObject = null;
  }

  function closeCamera() {
    stopStream();
    cameraModal.hidden = true;
    cameraError.hidden = true;
    cameraError.textContent = '';
    btnCapture.disabled = true;
  }

  async function openCamera() {
    cameraError.hidden = true;
    cameraError.textContent = '';
    btnCapture.disabled = true;
    cameraModal.hidden = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraError.textContent = 'Votre navigateur ne supporte pas l\'acces a la camera.';
      cameraError.hidden = false;
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraVideo.srcObject = mediaStream;
      await cameraVideo.play();
      btnCapture.disabled = false;
    } catch (err) {
      var msg;
      if (err.name === 'NotAllowedError') {
        msg = 'Acces a la camera refuse. Autorisez-le dans les reglages de votre navigateur.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Aucune camera detectee sur cet appareil.';
      } else {
        msg = 'Impossible d\'acceder a la camera : ' + err.message;
      }
      cameraError.textContent = msg;
      cameraError.hidden = false;
    }
  }

  btnCamera.addEventListener('click', openCamera);
  cameraClose.addEventListener('click', closeCamera);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !cameraModal.hidden) closeCamera();
  });

  cameraModal.addEventListener('click', function(e) {
    if (e.target === cameraModal) closeCamera();
  });

  btnCapture.addEventListener('click', function() {
    if (!cameraVideo.srcObject || cameraVideo.videoWidth === 0) return;

    var w = cameraVideo.videoWidth;
    var h = cameraVideo.videoHeight;
    cameraCanvas.width  = w;
    cameraCanvas.height = h;
    cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0, w, h);

    cameraCanvas.toBlob(function(blob) {
      if (!blob) {
        showError('Impossible de capturer l\'image. Reessayez.');
        closeCamera();
        return;
      }
      var capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      closeCamera();
      setFile(capturedFile);
    }, 'image/jpeg', 0.92);
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
      const headers = {};
      const token = getAuthToken();

      if (!token) {
        showError('Vous devez être connecté pour enregistrer une prédiction.');
        return;
      }

      headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/guesses', {
        method: 'POST',
        headers,
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
      resetFeedback();
      resultCard.hidden = false;
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(`Analyse impossible : ${err.message}`);
    } finally {
      btnAnalyse.classList.remove('is-loading');
      btnAnalyse.disabled = false;
    }
  });

  // Feedback : PUT /api/guesses/{id}
  const FEEDBACK_MESSAGES = {
     '1': 'Merci, vous avez confirmé la prédiction.',
     '0': 'Merci, cette image sera considérée comme hors catégorie.',
    '-1': 'Merci, vous avez signalé une mauvaise prédiction.',
  };

  feedbackBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.currentGuessId) return;
      const win = parseInt(btn.dataset.win, 10);

      feedbackBtns.forEach(b => { b.disabled = true; });
      btn.classList.add('is-selected');

      try {
        const res = await fetch(`/api/guesses/${state.currentGuessId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ win }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = (data && data.message) ? data.message : `Erreur ${res.status}`;
          throw new Error(msg);
        }

        // Message personnalisé selon le choix
        feedbackThanks.textContent = FEEDBACK_MESSAGES[String(win)];
        feedbackThanks.hidden = false;

        // Stats : neutres exclus du taux de réussite (l'API ne les compte pas non plus)
        if (win === 0) {
          feedbackStats.textContent = 'Les retours neutres ne sont pas inclus dans le taux de réussite.';
          feedbackStats.hidden = false;
        } else if (data && typeof data.total !== 'undefined' && typeof data.win !== 'undefined') {
          feedbackStats.textContent = `Taux de réussite de l'IA : ${data.win} bonne${data.win > 1 ? 's' : ''} prédiction${data.win > 1 ? 's' : ''} sur ${data.total} évaluation${data.total > 1 ? 's' : ''} Oui/Non.`;
          feedbackStats.hidden = false;
        }
      } catch (err) {
        showError(`Envoi du retour impossible : ${err.message}`);
        feedbackBtns.forEach(b => { b.disabled = false; });
        btn.classList.remove('is-selected');
      }
    });
  });
})();
