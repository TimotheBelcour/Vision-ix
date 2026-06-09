/* =====================================================================
 * app.js — Logique de la page "Défiez-moi" (page d'accueil Vision-ix)
 * ---------------------------------------------------------------------
 * Ce fichier orchestre TOUT le comportement côté navigateur :
 *   1. Sélection d'une image (bouton ou glisser-déposer)
 *   2. Prise de photo via la webcam (getUserMedia + canvas)
 *   3. Envoi de l'image à l'API PHP  -> POST /api/guesses
 *   4. Affichage du résultat de l'IA (Asterix / Obelix)
 *   5. Retour utilisateur (Oui / Neutre / Non) -> PUT /api/guesses/{id}
 *   6. Affichage du taux de réussite renvoyé par l'API
 *
 * Tout est enveloppé dans une IIFE (fonction auto-exécutée) pour ne PAS
 * polluer l'espace global : aucune variable ne "fuit" hors de ce fichier.
 * Stack : JavaScript natif (Vanilla JS), aucune librairie / framework.
 * ===================================================================== */
(() => {
  // --- Références aux éléments HTML manipulés (récupérés une seule fois) ---
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

  let mediaStream = null; // flux vidéo de la webcam (null tant que la caméra est fermée)

  // Formats acceptés : on filtre côté client AVANT l'envoi (l'API accepte les mêmes)
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  // "Mémoire" de la page : l'image courante et l'id de la prédiction renvoyé
  // par l'API. currentGuessId est indispensable pour ensuite envoyer le feedback.
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

  // setFile() est le POINT D'ENTRÉE UNIQUE de toute image, peu importe sa
  // provenance : bouton "Choisir", glisser-déposer OU photo webcam.
  // Centraliser ici évite de dupliquer la validation et la mise à jour de l'UI.
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

  /* ===================================================================
   * 1) UPLOAD D'IMAGE — bouton "Choisir" + glisser-déposer (drag & drop)
   * =================================================================== */

  // Le bouton "Choisir une image" déclenche le clic sur l'<input type="file">
  // caché : c'est l'astuce classique pour avoir un bouton au style personnalisé.
  btnChoose.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Quand l'utilisateur a choisi un fichier dans la boîte de dialogue système
  fileInput.addEventListener('change', (e) => {
    setFile(e.target.files[0]);
  });

  // Cliquer n'importe où dans la zone ouvre aussi le sélecteur de fichier
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

  // Le "drop" récupère le fichier lâché dans la zone (e.dataTransfer.files)
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    setFile(file);
  });

  /* ===================================================================
   * 2) PRISE DE PHOTO — webcam via l'API getUserMedia()
   *    Principe : on ouvre un flux vidéo, on le dessine dans un <canvas>
   *    caché, puis on convertit ce canvas en fichier image (capture.jpg).
   * =================================================================== */

  // Coupe proprement le flux webcam (libère la caméra = voyant éteint)
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
      // getUserMedia demande l'autorisation puis renvoie le flux de la caméra.
      // await cameraVideo.play() est OBLIGATOIRE sur Safari pour lancer la vidéo.
      // On n'active "Capturer" qu'une fois la vidéo réellement en lecture.
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

  // Clic sur "Capturer" : on fige l'image courante de la vidéo
  btnCapture.addEventListener('click', function() {
    if (!cameraVideo.srcObject || cameraVideo.videoWidth === 0) return; // sécurité : vidéo pas prête

    // On copie la frame vidéo dans un canvas aux dimensions réelles du flux
    var w = cameraVideo.videoWidth;
    var h = cameraVideo.videoHeight;
    cameraCanvas.width  = w;
    cameraCanvas.height = h;
    cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0, w, h);

    // toBlob() transforme le dessin du canvas en image binaire (JPEG qualité 0.92)
    cameraCanvas.toBlob(function(blob) {
      if (!blob) {
        showError('Impossible de capturer l\'image. Reessayez.');
        closeCamera();
        return;
      }
      // On emballe le blob dans un objet File : ainsi la photo webcam suit
      // EXACTEMENT le même chemin qu'une image importée (-> setFile()).
      var capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      closeCamera();
      setFile(capturedFile);
    }, 'image/jpeg', 0.92);
  });

  /* ===================================================================
   * 3) ANALYSE — envoi de l'image à l'API PHP : POST /api/guesses
   *    L'image part en multipart/form-data dans le champ "guessimage"
   *    (nom imposé par le backend). L'API renvoie { id, guess, ... }.
   * =================================================================== */
  btnAnalyse.addEventListener('click', async () => {
    if (!state.currentFile) return;
    clearError();

    // FormData = format multipart attendu pour envoyer un fichier.
    // "guessimage" est le nom de champ EXACT lu côté PHP : il ne faut pas le changer.
    const formData = new FormData();
    formData.append('guessimage', state.currentFile);

    btnAnalyse.disabled = true;                 // évite les double-clics pendant la requête
    btnAnalyse.classList.add('is-loading');     // affiche le spinner (CSS)

    try {
      const headers = {};
      const token = getAuthToken();

      if (!token) {
        showError('Vous devez être connecté pour enregistrer une prédiction.');
        return;
      }

      headers.Authorization = `Bearer ${token}`;

      // fetch() = requête HTTP asynchrone. await met en pause jusqu'à la réponse.
      const res = await fetch('/api/guesses', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json().catch(() => null); // on lit le JSON renvoyé par l'API

      // Si le statut n'est pas OK ou qu'il n'y a pas de prédiction, on lève une erreur
      if (!res.ok || !data || !data.guess) {
        const msg = (data && data.message) ? data.message : `Erreur ${res.status}`;
        throw new Error(msg);
      }

      /* --- 4) AFFICHAGE DU RÉSULTAT IA --- */
      state.currentGuessId = data.id;                          // on mémorise l'id pour le feedback
      resultImage.src = URL.createObjectURL(state.currentFile); // aperçu local de l'image (sans re-télécharger)
      resultImage.alt = `Image analysée — ${data.guess}`;
      resultGuess.textContent = data.guess;                     // "Asterix" ou "Obelix"
      resultCard.dataset.guessId = String(data.id);
      resetFeedback();                                          // réinitialise les boutons Oui/Neutre/Non
      resultCard.hidden = false;                                // on rend visible le bloc résultat
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); // défilement doux vers le résultat
    } catch (err) {
      showError(`Analyse impossible : ${err.message}`);
    } finally {
      btnAnalyse.classList.remove('is-loading');
      btnAnalyse.disabled = false;
    }
  });

  /* ===================================================================
   * 5) FEEDBACK UTILISATEUR — boutons Oui / Neutre / Non
   *    Chaque bouton porte un attribut data-win dans le HTML :
   *        Oui = 1   |   Neutre = 0   |   Non = -1
   *    On envoie cette valeur à l'API : PUT /api/guesses/{id} { win }
   * =================================================================== */

  // Message de remerciement adapté au choix de l'utilisateur
  const FEEDBACK_MESSAGES = {
     '1': 'Merci, vous avez confirmé la prédiction.',
     '0': 'Merci, cette image sera considérée comme hors catégorie.',
    '-1': 'Merci, vous avez signalé une mauvaise prédiction.',
  };

  feedbackBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.currentGuessId) return; // pas de feedback sans prédiction préalable
      const win = parseInt(btn.dataset.win, 10); // lit data-win et le convertit en nombre

      // On désactive les 3 boutons : un seul vote par prédiction
      feedbackBtns.forEach(b => { b.disabled = true; });
      btn.classList.add('is-selected'); // met en valeur le bouton choisi

      try {
        // Ici le corps est en JSON (et non multipart) : on envoie juste { win: ... }
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

        /* --- 6) AFFICHAGE DES STATISTIQUES DE RÉUSSITE ---
         * L'API renvoie { total, win } = nb d'évaluations Oui/Non et nb de bonnes
         * prédictions. Les votes "Neutre" sont volontairement EXCLUS de ce calcul,
         * côté backend comme côté affichage (cohérence du taux de réussite). */
        if (win === 0) {
          feedbackStats.textContent = 'Les retours neutres ne sont pas inclus dans le taux de réussite.';
          feedbackStats.hidden = false;
        } else if (data && typeof data.total !== 'undefined' && typeof data.win !== 'undefined') {
          // Template string + accord automatique du pluriel (s) selon les nombres
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
