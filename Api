// ============================================
// API 통신 모듈 - GAS 백엔드와 fetch로 통신
// ============================================

(function() {
  'use strict';

  // ★★★ 여기에 GAS 웹앱 배포 URL을 입력하세요 ★★★
  // 예: 'https://script.google.com/macros/s/AKfycbx.../exec'
  window.GAS_API_URL = 'https://여기에_GAS_웹앱_URL을_입력하세요/exec';

  // ★★★ 여기에 Google Maps API 키를 입력하세요 ★★★
  window.GMAPS_API_KEY = '여기에_GMAPS_KEY를_입력하세요';

  // ===== GET 요청 =====
  window.apiGet = async function(action, params) {
    var url = new URL(GAS_API_URL);
    url.searchParams.set('action', action);

    if (params) {
      Object.keys(params).forEach(function(key) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });
    }

    console.log('📡 API GET:', action);

    try {
      var response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });
      var data = await response.json();
      console.log('✅ API 응답:', action, data);
      return data;
    } catch (err) {
      console.error('❌ API 오류:', action, err);
      throw err;
    }
  };

  // ===== POST 요청 =====
  window.apiPost = async function(action, body) {
    console.log('📡 API POST:', action);

    try {
      var response = await fetch(GAS_API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(Object.assign({ action: action }, body))
      });
      var data = await response.json();
      console.log('✅ API 응답:', action, data);
      return data;
    } catch (err) {
      console.error('❌ API 오류:', action, err);
      throw err;
    }
  };

})();
