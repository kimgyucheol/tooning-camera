// ============================================
// 유틸리티 모듈
// ============================================

(function() {
  'use strict';

  window.appState = {
    currentStream: null,
    userPos: null,
    selectedCompanyId: null,
    companyList: [],
    modelsLoaded: false,
    currentAttType: '',
    currentUserName: '',
    currentUserSSN: '',
    withinRange: false,
    loadingProgress: 0,
    excludeMinutes: 0,
    capturedImageForRegister: null,
    capturedImageForAuth: null
  };

  // ===== LocalStorage 캐시 =====

  window.checkAuthCache = function() {
    var today = new Date().toISOString().split('T')[0];
    var cacheKey = 'auth_' + appState.currentUserSSN + '_' + today;
    var cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  };

  window.saveAuthCache = function(checkInTime) {
    var today = new Date().toISOString().split('T')[0];
    var cacheKey = 'auth_' + appState.currentUserSSN + '_' + today;
    localStorage.setItem(cacheKey, JSON.stringify({
      date: today,
      checkInTime: checkInTime,
      authenticated: true
    }));
    var btn = document.getElementById('records-button-container');
    if (btn) btn.classList.remove('hidden');
  };

  window.saveUserCache = function(ssn, name) {
    localStorage.setItem('last_user_ssn', ssn);
    localStorage.setItem('last_user_name', name);
  };

  window.loadUserCache = function() {
    return {
      ssn: localStorage.getItem('last_user_ssn'),
      name: localStorage.getItem('last_user_name')
    };
  };

  window.clearAuthCache = function() {
    var today = new Date().toISOString().split('T')[0];
    var cacheKey = 'auth_' + appState.currentUserSSN + '_' + today;
    localStorage.removeItem(cacheKey);
  };

  // ===== 주민번호 입력 =====

  window.initSSNInputs = function() {
    var ssnFirst = document.getElementById('ssnFirst');
    var ssnSecond = document.getElementById('ssnSecond');
    if (!ssnFirst || !ssnSecond) return;

    ssnFirst.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value.length === 6) ssnSecond.focus();
    });

    ssnSecond.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
    });

    ssnSecond.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && this.value.length === 0) {
        ssnFirst.focus();
      }
    });

    ssnFirst.addEventListener('paste', function(e) {
      e.preventDefault();
      var cleaned = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (cleaned.length > 6) {
        this.value = cleaned.substring(0, 6);
        ssnSecond.value = cleaned.substring(6, 13);
        ssnSecond.focus();
      } else {
        this.value = cleaned;
        if (cleaned.length === 6) ssnSecond.focus();
      }
    });
  };

  // ===== 로딩 =====

  window.updateLoadingProgress = function(progress, text) {
    appState.loadingProgress = progress;
    var fill = document.getElementById('loading-bar-fill');
    var textElem = document.getElementById('initial-loading-text');
    if (fill) fill.style.width = progress + '%';
    if (textElem) textElem.textContent = text;
  };

  window.showApp = function() {
    var initialLoading = document.getElementById('initial-loading');
    var appContainer = document.getElementById('app-container');
    if (!initialLoading || !appContainer) return;

    initialLoading.style.opacity = '0';
    setTimeout(function() {
      initialLoading.style.display = 'none';
      appContainer.classList.remove('hidden');
      appContainer.style.display = 'block';
      appContainer.style.opacity = '1';
      initSSNInputs();
    }, 800);
  };

  window.setLoading = function(show, text) {
    var loader = document.getElementById('loading');
    var lText = document.getElementById('loading-text');
    if (loader) loader.classList.toggle('hidden', !show);
    if (lText) lText.textContent = text || '처리 중...';
  };

  window.loadImage = function(src) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  };

  // ===== 카메라 팝업 =====

  window.openCameraPopup = function(mode) {
    var m = mode || appState.currentAttType || 'auth';
    // 현재 페이지와 같은 디렉토리의 camera.html을 연다
    var baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    var url = baseUrl + 'camera.html?mode=' + m;
    console.log("📸 카메라 팝업:", url);

    var popup = window.open(url, '_blank', 'width=500,height=750,scrollbars=yes');
    if (!popup || popup.closed) {
      alert('팝업이 차단되었습니다.\n팝업 차단을 해제해주세요.');
      window.open(url, '_blank');
    }
  };

  window.openCameraForRegister = function() {
    openCameraPopup('register');
  };

  // ===== postMessage 수신 =====

  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    console.log("📩 메시지 수신:", data.type, data.mode);

    if (data.type === 'camera-capture') {
      if (data.mode === 'register') {
        appState.capturedImageForRegister = data.imageData;

        var placeholder = document.getElementById('reg-placeholder');
        var preview = document.getElementById('reg-preview-image');
        if (placeholder) placeholder.classList.add('hidden');
        if (preview) { preview.src = data.imageData; preview.classList.remove('hidden'); }

        var regBtn = document.getElementById('btn-register');
        if (regBtn) {
          regBtn.disabled = false;
          regBtn.className = 'w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white p-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-amber-700 transition shadow-lg';
          regBtn.textContent = '✅ 등록하기';
        }

      } else if (data.mode === 'auth') {
        appState.capturedImageForAuth = data.imageData;

        var statusSection = document.getElementById('auth-status-section');
        var cameraBtn = document.getElementById('btn-open-camera');
        if (statusSection) statusSection.classList.remove('hidden');
        if (cameraBtn) cameraBtn.classList.add('hidden');

        processAuthWithCapturedImage(data.imageData);
      }
    }
  });

  // ===== 얼굴 인증 처리 =====

  window.processAuthWithCapturedImage = async function(capturedImageData) {
    setLoading(true, "얼굴 인식 중...");
    var statusText = document.getElementById('auth-status-text');

    try {
      if (statusText) statusText.textContent = '등록된 사진을 불러오는 중...';

      var res = await apiGet('getUserImageData', { ssn: appState.currentUserSSN });

      if (!res.success || !res.imageData) {
        setLoading(false);
        resetAuthModalUI();
        alert("등록된 사진이 없습니다. 먼저 신규 등록을 해주세요.");
        closeAuthModal();
        return;
      }

      if (statusText) statusText.textContent = '등록 사진에서 얼굴 분석 중...';
      var refImg = await loadImage(res.imageData);
      var refDetection = await faceapi.detectSingleFace(refImg).withFaceLandmarks().withFaceDescriptor();

      if (!refDetection) {
        setLoading(false);
        resetAuthModalUI();
        alert("등록된 사진에서 얼굴을 찾을 수 없습니다.\n다시 등록해주세요.");
        return;
      }

      if (statusText) statusText.textContent = '촬영 사진에서 얼굴 분석 중...';
      var liveImg = await loadImage(capturedImageData);
      var liveDetection = await faceapi.detectSingleFace(liveImg).withFaceLandmarks().withFaceDescriptor();

      if (!liveDetection) {
        setLoading(false);
        resetAuthModalUI();
        alert("촬영된 사진에서 얼굴을 찾을 수 없습니다.\n다시 촬영해주세요.");
        return;
      }

      if (statusText) statusText.textContent = '얼굴 비교 중...';
      var distance = faceapi.euclideanDistance(refDetection.descriptor, liveDetection.descriptor);
      var similarity = Math.max(0, (1 - distance) * 100);

      console.log("📊 유사도:", similarity.toFixed(2) + "%");

      if (similarity >= 70) {
        if (statusText) statusText.textContent = '인증 성공! 저장 중...';
        processAttendance(similarity);
      } else {
        setLoading(false);
        resetAuthModalUI();
        alert("인증 실패 (유사도: " + similarity.toFixed(2) + "%)\n다시 촬영해주세요.");
      }

    } catch (error) {
      setLoading(false);
      resetAuthModalUI();
      console.error("얼굴 인식 오류:", error);
      alert("얼굴 인식 중 오류가 발생했습니다.");
    }
  };

  window.resetAuthModalUI = function() {
    var statusSection = document.getElementById('auth-status-section');
    var cameraBtn = document.getElementById('btn-open-camera');
    if (statusSection) statusSection.classList.add('hidden');
    if (cameraBtn) cameraBtn.classList.remove('hidden');
  };

})();
