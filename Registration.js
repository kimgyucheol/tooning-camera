// ============================================
// 사용자 등록 모듈
// ============================================

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var setup = function() {
      var ssnFirst = document.getElementById('ssnFirst');
      var ssnSecond = document.getElementById('ssnSecond');
      if (!ssnFirst || !ssnSecond) { setTimeout(setup, 100); return; }

      ssnFirst.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 6) ssnSecond.focus();
      });
      ssnSecond.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
      });
      ssnSecond.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value.length === 0) ssnFirst.focus();
      });
    };
    setup();
  });

  window.handleRegister = async function() {
    var nameInput = document.getElementById('regName');
    var ssnFirst = document.getElementById('ssnFirst');
    var ssnSecond = document.getElementById('ssnSecond');

    if (!nameInput || !ssnFirst || !ssnSecond) {
      alert("입력 필드를 찾을 수 없습니다.");
      return;
    }

    var name = nameInput.value.trim();
    var f = ssnFirst.value.trim();
    var s = ssnSecond.value.trim();

    if (!name) { alert("이름을 입력해주세요."); nameInput.focus(); return; }
    if (f.length !== 6 || !/^\d{6}$/.test(f)) { alert("주민번호 앞자리 6자리를 입력해주세요."); ssnFirst.focus(); return; }
    if (s.length !== 7 || !/^\d{7}$/.test(s)) { alert("주민번호 뒷자리 7자리를 입력해주세요."); ssnSecond.focus(); return; }

    var ssn = f + s;
    var imageData = appState.capturedImageForRegister;

    if (!imageData) {
      alert("먼저 '얼굴 사진 촬영' 버튼을 눌러 사진을 촬영해주세요.");
      return;
    }

    setLoading(true, "등록 중...");

    try {
      var result = await apiPost('registerUser', {
        name: name,
        ssn: ssn,
        imageData: imageData
      });

      setLoading(false);

      if (result.success) {
        alert("✅ 등록 완료!\n\n이름: " + name + "\n주민번호: " + f + "-" + s.substring(0, 1) + "******\n등록일시: " + result.timestamp);

        nameInput.value = '';
        ssnFirst.value = '';
        ssnSecond.value = '';

        var placeholder = document.getElementById('reg-placeholder');
        var preview = document.getElementById('reg-preview-image');
        if (placeholder) placeholder.classList.remove('hidden');
        if (preview) { preview.classList.add('hidden'); preview.src = ''; }

        var regBtn = document.getElementById('btn-register');
        if (regBtn) {
          regBtn.disabled = true;
          regBtn.className = 'w-full bg-gray-300 text-gray-500 p-5 rounded-2xl font-bold text-lg cursor-not-allowed transition';
          regBtn.textContent = '✅ 등록하기 (사진 촬영 후 활성화)';
        }

        appState.capturedImageForRegister = null;
      } else {
        alert("❌ 등록 실패\n\n" + (result.error || "알 수 없는 오류"));
      }
    } catch (err) {
      setLoading(false);
      alert("❌ 서버 오류\n\n등록 중 문제가 발생했습니다.");
    }
  };

})();
