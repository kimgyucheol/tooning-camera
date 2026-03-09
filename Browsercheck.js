// ============================================
// 브라우저 체크
// ============================================

(function() {
  'use strict';

  function detectInAppBrowser() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('kakaotalk') > -1) return { isInApp: true, name: '카카오톡 인앱 브라우저' };
    if (ua.indexOf('naver') > -1) return { isInApp: true, name: '네이버 앱' };
    if (ua.indexOf('fban') > -1 || ua.indexOf('fbav') > -1) return { isInApp: true, name: '페이스북 인앱 브라우저' };
    if (ua.indexOf('instagram') > -1) return { isInApp: true, name: '인스타그램 인앱 브라우저' };
    if (ua.indexOf('line') > -1) return { isInApp: true, name: '라인 인앱 브라우저' };
    if (ua.indexOf('wv') > -1 || ua.indexOf('webview') > -1) return { isInApp: true, name: '인앱 브라우저' };
    if (/(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(ua)) return { isInApp: true, name: 'iOS 인앱 브라우저' };
    return { isInApp: false, name: null };
  }

  function detectBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return { name: 'Google Chrome ✅', isChrome: true };
    if (ua.indexOf('Edg') > -1) return { name: 'Microsoft Edge', isChrome: false };
    if (ua.indexOf('Firefox') > -1) return { name: 'Mozilla Firefox', isChrome: false };
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return { name: 'Apple Safari', isChrome: false };
    return { name: '알 수 없는 브라우저', isChrome: false };
  }

  function checkAndShowModal() {
    var modal = document.getElementById('browser-check-modal');
    var browserText = document.getElementById('current-browser');
    if (!modal || !browserText) return;

    var inApp = detectInAppBrowser();
    if (inApp.isInApp) {
      browserText.textContent = inApp.name;
      modal.classList.remove('hidden');
      return;
    }

    var browser = detectBrowser();
    browserText.textContent = browser.name;
    if (!browser.isChrome) modal.classList.remove('hidden');
  }

  window.closeBrowserCheckModal = function() {
    var modal = document.getElementById('browser-check-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.copyCurrentURL = function() {
    var url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        alert('URL이 복사되었습니다!\nChrome 앱에서 붙여넣기 해주세요.');
      });
    } else {
      prompt('아래 URL을 복사해주세요:', url);
    }
  };

  setTimeout(checkAndShowModal, 800);
})();
