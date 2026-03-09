// ============================================
// 얼굴 인식 모듈
// ============================================

(function() {
  'use strict';

  window.loadFaceApiModels = async function() {
    if (appState.modelsLoaded) return;
    try {
      updateLoadingProgress(20, 'AI 모델 로딩 중...');
      var MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      updateLoadingProgress(40, 'AI 모델 로딩 중...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      updateLoadingProgress(60, 'AI 모델 로딩 중...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      appState.modelsLoaded = true;
      updateLoadingProgress(70, 'AI 모델 로딩 완료');
    } catch (error) {
      console.error("Face-API 모델 로딩 실패:", error);
      updateLoadingProgress(70, '모델 로딩 실패');
    }
  };

  window.startFaceRecognition = function() {
    openCameraPopup('auth');
  };

  // ===== 출퇴근 기록 저장 =====
  window.processAttendance = async function(similarity) {
    setLoading(true, "인증 성공! 최종 저장중...");

    var type = appState.currentAttType;
    var ssn = appState.currentUserSSN;
    var companyId = appState.selectedCompanyId;
    var excludeMinutes = appState.excludeMinutes || 0;

    try {
      var res = await apiPost('processAttendanceRecord', {
        ssn: ssn,
        type: type,
        companyId: companyId,
        excludeMinutes: excludeMinutes
      });

      if (res.success) {
        showMessageModal(type, similarity.toFixed(1), res.message, res.hours, res.mins);
      } else {
        setLoading(false);
        resetAuthModalUI();
        alert("⚠️ " + (res.error || "알 수 없는 오류"));
      }
    } catch (err) {
      setLoading(false);
      resetAuthModalUI();
      alert("서버 통신 실패: " + err.message);
    }
  };

})();
