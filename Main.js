// ============================================
// 메인 UI 로직
// ============================================

(function() {
  'use strict';

  // ===== 제외시간 관리 =====

  window.addExcludeTime = function(minutes) {
    appState.excludeMinutes += minutes;
    updateExcludeTimeDisplay();
  };

  window.resetExcludeTime = function() {
    appState.excludeMinutes = 0;
    updateExcludeTimeDisplay();
  };

  function updateExcludeTimeDisplay() {
    var display = document.getElementById('exclude-time-display');
    if (!display) return;
    var h = Math.floor(appState.excludeMinutes / 60);
    var m = appState.excludeMinutes % 60;
    if (h > 0 && m > 0) display.textContent = h + '시간 ' + m + '분';
    else if (h > 0) display.textContent = h + '시간';
    else if (m > 0) display.textContent = m + '분';
    else display.textContent = '0분';
  }

  // ===== 탭 전환 =====

  window.switchTab = function(tabId) {
    ['sec-att', 'sec-reg', 'sec-setting'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    var target = document.getElementById('sec-' + tabId);
    if (target) target.classList.remove('hidden');

    ['tab-att', 'tab-reg', 'tab-setting'].forEach(function(id) {
      var tab = document.getElementById(id);
      if (!tab) return;
      if (id === 'tab-' + tabId) {
        tab.classList.add('text-orange-600', 'border-b-2', 'border-orange-600');
        tab.classList.remove('text-gray-500');
      } else {
        tab.classList.remove('text-orange-600', 'border-b-2', 'border-orange-600');
        tab.classList.add('text-gray-500');
      }
    });

    if (tabId === 'setting') renderCompanyList();
  };

  // ===== 출퇴근 인증 =====

  window.showCameraForAuth = async function(type) {
    if (type === '출근') {
      var cached = checkAuthCache();
      if (cached && cached.authenticated) {
        alert("이미 출근 처리되었습니다.\n출근 시간: " + cached.checkInTime);
        return;
      }

      setLoading(true, "출근 기록 확인 중...");
      try {
        var res = await apiGet('checkTodayCheckIn', { ssn: appState.currentUserSSN });
        setLoading(false);
        if (res.hasCheckIn) {
          alert("오늘은 이미 출근하셨습니다.");
          var btn = document.getElementById('records-button-container');
          if (btn) btn.classList.remove('hidden');
          return;
        }
      } catch (err) {
        setLoading(false);
      }
    }

    openAuthModal(type);
  };

  function openAuthModal(type) {
    appState.currentAttType = type;
    var modal = document.getElementById('auth-modal');
    if (!modal) return;

    var header = document.getElementById('auth-modal-header');
    var icon = document.getElementById('auth-modal-icon');
    var title = document.getElementById('auth-modal-title');
    var subtitle = document.getElementById('auth-modal-subtitle');
    var excludeSection = document.getElementById('exclude-time-section');

    if (type === '출근') {
      header.className = 'p-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white';
      icon.textContent = '☀️';
      title.textContent = '출근 인증';
      subtitle.textContent = '카메라 촬영으로 본인 인증을 진행합니다';
      if (excludeSection) excludeSection.classList.add('hidden');
    } else {
      header.className = 'p-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-white';
      icon.textContent = '🌙';
      title.textContent = '퇴근 인증';
      subtitle.textContent = '제외시간 설정 후 촬영해주세요';
      if (excludeSection) {
        excludeSection.classList.remove('hidden');
        appState.excludeMinutes = 60;
        updateExcludeTimeDisplay();
      }
    }

    resetAuthModalUI();
    modal.classList.remove('hidden');
  }

  window.closeAuthModal = function() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    appState.excludeMinutes = 0;
    resetAuthModalUI();
  };

  // ===== 지도 =====

  window.initMap = async function() {
    if (!navigator.geolocation) {
      alert("위치 정보를 지원하지 않습니다.");
      return;
    }

    setLoading(true, "위치 확인 중...");

    navigator.geolocation.getCurrentPosition(async function(position) {
      var pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      appState.userPos = pos;

      try {
        var companyPos = await apiGet('getCompanyLocation', { companyId: appState.selectedCompanyId });

        if (!companyPos.success) {
          setLoading(false);
          alert("회사 위치 정보를 가져올 수 없습니다.");
          return;
        }

        var map = new google.maps.Map(document.getElementById('map'), {
          center: pos, zoom: 15, disableDefaultUI: true
        });
        new google.maps.Marker({ position: pos, map: map, title: "내 위치" });
        new google.maps.Marker({
          position: { lat: companyPos.lat, lng: companyPos.lng },
          map: map, title: "회사",
          icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
        });
        checkDistance(pos, { lat: companyPos.lat, lng: companyPos.lng });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        alert("회사 위치 정보를 가져올 수 없습니다.");
      }
    }, function() {
      setLoading(false);
      alert("위치 권한을 허용해주세요.");
    });
  };

  window.refreshLocation = function() {
    if (!appState.currentUserSSN) {
      alert("먼저 사용자를 선택해주세요.");
      return;
    }
    initMap();
  };

  window.checkDistance = function(userPos, companyPos) {
    var p1 = new google.maps.LatLng(userPos.lat, userPos.lng);
    var p2 = new google.maps.LatLng(companyPos.lat, companyPos.lng);
    var distance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

    var distText = document.getElementById('distance-text');
    var distInfo = document.getElementById('distance-info');
    var btnGroup = document.getElementById('attendance-buttons');

    if (distInfo) distInfo.classList.remove('hidden');
    if (distText) distText.textContent = '회사와의 거리: 약 ' + Math.round(distance) + 'm';

    if (distance <= 1000) {
      if (distInfo) distInfo.className = "p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700";
      if (btnGroup) btnGroup.classList.remove('hidden');
      appState.withinRange = true;
    } else {
      if (distInfo) distInfo.className = "p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700";
      if (btnGroup) btnGroup.classList.add('hidden');
      appState.withinRange = false;
    }
  };

  // ===== 사용자 목록 =====

  window.reloadUserList = async function() {
    setLoading(true, "사용자 목록 불러오는 중...");
    try {
      var list = await apiGet('getUserList');
      setLoading(false);

      var sel = document.getElementById('userSelect');
      if (!sel) return;
      var currentValue = sel.value;
      sel.innerHTML = '<option value="">👤 사용자 선택</option>';

      if (list && list.length > 0) {
        list.forEach(function(u) { sel.add(new Option(u.name, u.id)); });
        if (currentValue) {
          var exists = Array.from(sel.options).some(function(opt) { return opt.value === currentValue; });
          if (exists) sel.value = currentValue;
        }

        showNotification('사용자 목록 업데이트 완료 (' + list.length + '명)');
      } else {
        alert("등록된 사용자가 없습니다.");
      }
    } catch (err) {
      setLoading(false);
      alert("사용자 목록을 불러오는데 실패했습니다.");
    }
  };

  function showNotification(msg) {
    var notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 slide-up';
    notification.innerHTML = '<div class="flex items-center gap-2"><span class="text-xl">✅</span><span class="font-semibold">' + msg + '</span></div>';
    document.body.appendChild(notification);
    setTimeout(function() { notification.remove(); }, 3000);
  }

  window.onUserSelect = async function() {
    var userSelect = document.getElementById('userSelect');
    if (!userSelect || !userSelect.value) {
      var stepLoc = document.getElementById('step-location');
      if (stepLoc) stepLoc.classList.add('hidden');
      return;
    }

    appState.currentUserSSN = userSelect.value;
    appState.currentUserName = userSelect.options[userSelect.selectedIndex].text;
    saveUserCache(appState.currentUserSSN, appState.currentUserName);

    var stepLoc = document.getElementById('step-location');
    if (stepLoc) stepLoc.classList.remove('hidden');

    initMap();

    try {
      var res = await apiGet('checkTodayCheckIn', { ssn: appState.currentUserSSN });
      var btn = document.getElementById('records-button-container');
      if (btn && res.hasCheckIn) btn.classList.remove('hidden');
    } catch (e) {}
  };

  // ===== 메시지 모달 =====

  window.showMessageModal = function(type, similarity, message, hours, mins) {
    var modal = document.getElementById('message-modal');
    if (!modal) { setLoading(false); return; }

    document.getElementById('modal-title').textContent = type + ' 완료!';
    document.getElementById('modal-subtitle').textContent = '유사도: ' + similarity + '%';
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-icon').textContent = type === '출근' ? '🎉' : '🌙';

    var header = document.getElementById('modal-header');
    if (header) {
      header.className = type === '출근'
        ? 'p-8 text-center gradient-bg text-white'
        : 'p-8 text-center bg-gradient-to-r from-amber-500 to-yellow-600 text-white';
    }

    if (type === '출근') {
      var now = new Date();
      var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      saveAuthCache(timeStr);
    } else {
      clearAuthCache();
    }

    closeAuthModal();
    setLoading(false);
    modal.classList.remove('hidden');
  };

  window.closeMessageModal = async function() {
    var modal = document.getElementById('message-modal');
    if (modal) modal.classList.add('hidden');

    try {
      var res = await apiGet('checkTodayCheckIn', { ssn: appState.currentUserSSN });
      var btn = document.getElementById('records-button-container');
      if (btn && res.hasCheckIn) btn.classList.remove('hidden');
    } catch (e) {}
  };

  // ===== 기록 모달 =====

  var currentRecords = [];
  var RECORDS_PER_PAGE = 5;
  var currentPage = 1;
  var totalPages = 1;

  window.showRecordsModal = async function() {
    setLoading(true, "기록 불러오는 중...");
    try {
      var logs = await apiGet('getUserAttendanceRecords', { ssn: appState.currentUserSSN });
      setLoading(false);
      if (!logs || logs.length === 0) {
        alert("출근 기록이 없습니다.");
        return;
      }
      currentRecords = logs;
      currentPage = 1;
      totalPages = Math.ceil(currentRecords.length / RECORDS_PER_PAGE);
      renderRecordsPage();
      document.getElementById('records-modal').classList.remove('hidden');
    } catch (err) {
      setLoading(false);
      alert("기록을 불러오는데 실패했습니다.");
    }
  };

  window.closeRecordsModal = function() {
    var modal = document.getElementById('records-modal');
    if (modal) modal.classList.add('hidden');
  };

  function renderRecordsPage() {
    var list = document.getElementById('records-list');
    if (!list) return;
    list.innerHTML = '';

    var start = (currentPage - 1) * RECORDS_PER_PAGE;
    var pageRecords = currentRecords.slice(start, start + RECORDS_PER_PAGE);

    pageRecords.forEach(function(log) {
      var card = document.createElement('div');
      card.className = 'bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-100';
      var co = log.checkOutTime || '진행 중';
      var wt = log.workTime || '계산 중';
      var et = log.excludeTime || '0분';

      card.innerHTML =
        '<div class="flex items-center justify-between mb-2">' +
        '<span class="font-bold text-orange-900 text-lg">📅 ' + log.date + '</span>' +
        '<span class="text-xs px-3 py-1 rounded-full ' + (co === '진행 중' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600') + '">' +
        (co === '진행 중' ? '근무중' : '완료') + '</span></div>' +
        '<div class="space-y-1 text-sm text-gray-700">' +
        '<p>☀️ 출근: <span class="font-semibold text-orange-600">' + log.checkInTime + '</span></p>' +
        '<p>🌙 퇴근: <span class="font-semibold text-amber-600">' + co + '</span></p>' +
        '<p>⏱️ 근무시간: <span class="font-semibold text-gray-800">' + wt + '</span></p>' +
        (et !== '0분' ? '<p>⏸️ 제외시간: <span class="font-semibold text-red-600">' + et + '</span></p>' : '') +
        '</div>';

      list.appendChild(card);
    });

    var pageInfo = document.getElementById('page-info');
    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    if (pageInfo) pageInfo.textContent = currentPage + ' / ' + (totalPages || 1);
    if (prevBtn) { prevBtn.disabled = currentPage <= 1; prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1'; }
    if (nextBtn) { nextBtn.disabled = currentPage >= totalPages; nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1'; }
  }

  window.prevPage = function() { if (currentPage > 1) { currentPage--; renderRecordsPage(); } };
  window.nextPage = function() { if (currentPage < totalPages) { currentPage++; renderRecordsPage(); } };

  // ===== 회사 목록 =====

  window.renderCompanyList = function() {
    var container = document.getElementById('company-list');
    if (!container) return;
    container.innerHTML = '';

    if (!appState.companyList || appState.companyList.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 회사가 없습니다.</p>';
      return;
    }

    appState.companyList.forEach(function(company) {
      var isSelected = String(company.id) === String(appState.selectedCompanyId);
      var card = document.createElement('div');
      card.className = 'p-4 rounded-2xl border-2 cursor-pointer transition ' +
        (isSelected ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-500' : 'bg-white border-gray-200 hover:border-orange-300');

      card.onclick = function() { selectCompany(company.id); };
      card.innerHTML =
        '<div class="flex items-center justify-between"><div class="flex-1">' +
        '<h3 class="font-bold text-gray-800 text-lg">' + company.name + '</h3>' +
        '<p class="text-sm text-gray-600 mt-1">📍 ' + company.location + '</p></div>' +
        (isSelected ? '<span class="text-2xl">✅</span>' : '<span class="text-2xl opacity-30">⭕</span>') +
        '</div>';

      container.appendChild(card);
    });
  };

  function selectCompany(companyId) {
    appState.selectedCompanyId = String(companyId);
    localStorage.setItem('selectedCompanyId', appState.selectedCompanyId);
    renderCompanyList();
    updateCompanyDisplay();
  }

  window.updateCompanyDisplay = function() {
    var display = document.getElementById('current-company-display');
    if (!display) return;
    var company = appState.companyList.find(function(c) { return String(c.id) === String(appState.selectedCompanyId); });
    if (company) display.textContent = '📍 현재 선택: ' + company.name;
  };

  // ===== 초기화 =====

  window.onload = async function() {
    try {
      if (typeof initThreeJS === 'function') initThreeJS();
      await loadFaceApiModels();

      appState.selectedCompanyId = localStorage.getItem('selectedCompanyId') || '1';

      var companies = await apiGet('getCompanyList');
      appState.companyList = companies || [];
      renderCompanyList();
      updateCompanyDisplay();

      var users = await apiGet('getUserList');
      var sel = document.getElementById('userSelect');
      if (sel) {
        sel.innerHTML = '<option value="">👤 사용자 선택</option>';
        if (users) users.forEach(function(u) { sel.add(new Option(u.name, u.id)); });

        var cached = loadUserCache();
        if (cached && cached.ssn) {
          setTimeout(function() {
            sel.value = cached.ssn;
            onUserSelect();
          }, 500);
        }
      }

      updateLoadingProgress(100, '준비 완료!');
      setTimeout(function() { showApp(); }, 500);
    } catch (e) {
      console.error("초기화 오류:", e);
      showApp();
    }
  };

})();
