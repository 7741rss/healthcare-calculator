/**
 * [공통입력 페이지] 모듈 (commonInput.js)
 * 
 * 1. 상단: [본인(세대주)] & [세대 합산] 재산/소득 총계 실시간 요약 바
 * 2. 단계 1: 재산세과세표준(주택, 토지, 건물 등) 4종 분할 입력 + 세대원 추가/전면카드 + [이관] 재산세 Check 박스
 * 3. 단계 2: 연간 소득 입력 6종 분할 입력 + 세대원 추가/전면카드 + [이관] 소득 Check 박스
 * 4. 하단: [💾 저장] 및 [✏️ 수정] 툴바 & [🔍 피부양자 자격 확인하러 가기 ➔] 버튼
 */

import { appState } from '../state.js?v=20260921_01';
import { formatKoreanMoney, formatNumber } from '../rules/healthData2026.js?v=20260921_01';

export class CommonInputModule {
  constructor(containerId, onProceedToDiagnosis) {
    this.container = document.getElementById(containerId);
    this.onProceedToDiagnosis = onProceedToDiagnosis;
    this.onNavigateToMenu1 = onProceedToDiagnosis; // 호환성 유지

    // 세대원 재산 인라인 및 전면 노출 상태 / CHECKPOINT (기본 숨김)
    this.currentEditingPropId = null;
    this.isPropInlineOpen = false;
    this.isPropFrontVisible = false;
    this.isPropCheckpointOpen = false;

    // 세대원 소득 인라인 및 전면 노출 상태 / CHECKPOINT (기본 숨김)
    this.currentEditingIncomeId = null;
    this.isIncomeIncomeOpen = false;
    this.isIncomeFrontVisible = false;
    this.isIncomeCheckpointOpen = false;
  }

  init() {
    this.render();
    this.refreshInputs();
  }

  showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth; // reflow
    toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // 상단 요약 바 갱신
  updateSummaryBar() {
    const indivProp = appState.getIndividualPropertyTotal();
    const indivIncome = appState.getIndividualIncomeTotal();
    const houseProp = appState.getHouseholdPropertyTotal();
    const houseIncome = appState.getHouseholdIncomeTotal();

    const indivPropEl = document.getElementById('summaryIndivProp');
    const indivIncomeEl = document.getElementById('summaryIndivIncome');
    const housePropEl = document.getElementById('summaryHouseProp');
    const houseIncomeEl = document.getElementById('summaryHouseIncome');

    if (indivPropEl) indivPropEl.textContent = formatKoreanMoney(indivProp);
    if (indivIncomeEl) indivIncomeEl.textContent = formatKoreanMoney(indivIncome);
    if (housePropEl) housePropEl.textContent = formatKoreanMoney(houseProp);
    if (houseIncomeEl) houseIncomeEl.textContent = formatKoreanMoney(houseIncome);
  }

  refreshInputs() {
    const householdProp = appState.getHouseholdPropertyByCategory(true);
    const householdIncome = appState.getHouseholdIncomeByCategory(true);
    const state = appState.getState();

    const setValue = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        if (val === undefined || val === null || val === '') {
          el.value = '';
          return;
        }
        const num = typeof val === 'string' ? Number(val.replace(/[^0-9.-]/g, '')) : Number(val);
        el.value = (!isNaN(num) && num > 0) ? formatNumber(num) : '';
      }
    };

    // 1. 재산 4개 세부 항목 (세대 전체 합산 표출)
    setValue('ci_propHouse', householdProp.propHouse);
    setValue('ci_propBuilding', householdProp.propBuilding);
    setValue('ci_propLand', householdProp.propLand);
    setValue('ci_propShipPlane', householdProp.propShipPlane);

    // 2. 소득 6개 세부 항목 (세대 전체 합산 표출)
    setValue('ci_businessIncome', householdIncome.businessIncome);
    setValue('ci_laborIncome', householdIncome.laborIncome);
    setValue('ci_interestIncome', householdIncome.interestIncome);
    setValue('ci_dividendIncome', householdIncome.dividendIncome);
    setValue('ci_pensionIncome', householdIncome.pensionIncome);
    setValue('ci_otherIncome', householdIncome.otherIncome);

    // 3. 퇴직 전 직장 건강보험료 (장기요양 포함)
    setValue('ci_prevWorkHealthFee', state.voluntary?.prevWorkHealthFee);

    this.renderRegisteredMembersPropFrontView();
    this.renderRegisteredMembersIncomeFrontView();
    this.updateSummaryBar();
  }

  // =========================================================================
  // 1. 재산 세대원 관리 및 전면 노출
  // =========================================================================
  renderRegisteredMembersPropFrontView() {
    const frontContainer = document.getElementById('ci_registeredMembersPropFrontContainer');
    const state = appState.getState();
    const u = state.primaryUser;
    const familyMembers = state.familyMembers || [];

    const calcUserProp = (obj) => (
      (Number(obj.propHouse) || 0) + 
      (Number(obj.propBuilding) || 0) + 
      (Number(obj.propLand) || 0) + 
      (Number(obj.propShipPlane) || 0)
    );

    const uPropTotal = calcUserProp(u) > 0 ? calcUserProp(u) : (Number(u.propertyTaxBase) || 0);
    const membersWithProp = familyMembers.filter(m => calcUserProp(m) > 0);
    const activeCount = (uPropTotal > 0 ? 1 : 0) + membersWithProp.length;

    const propCountBadge = document.getElementById('ci_propFrontCountBadge');
    if (propCountBadge) propCountBadge.textContent = `${activeCount}명`;

    const textEl = document.getElementById('ci_btnTogglePropFrontViewText');
    const toggleBtn = document.getElementById('ci_btnTogglePropFrontView');
    if (textEl) textEl.textContent = `세대원별 재산 ${this.isPropFrontVisible ? '숨기기 ▲' : '보기'}`;
    if (toggleBtn) {
      if (this.isPropFrontVisible) toggleBtn.classList.add('active');
      else toggleBtn.classList.remove('active');
    }

    if (!frontContainer) return;
    if (activeCount === 0) {
      frontContainer.innerHTML = '';
      frontContainer.style.display = 'none';
      return;
    }

    frontContainer.style.display = this.isPropFrontVisible ? 'block' : 'none';

    let cardsHtml = '';
    if (uPropTotal > 0) {
      cardsHtml += `
        <div class="family-front-card card-primary-user">
          <div class="family-front-card-top">
            <div class="family-front-identity">
              <span class="badge-member-tag badge-primary-tag">👤 본인 (세대주)</span>
              <span class="family-front-total-text"><strong>${formatNumber(uPropTotal)}원</strong></span>
            </div>
            <div class="family-front-card-actions">
              <button type="button" class="btn-card-action btn-edit-prop-front" data-id="primary">✏️ 수정</button>
              <button type="button" class="btn-card-action text-danger btn-del-prop-front" data-id="primary">🗑️ 삭제</button>
            </div>
          </div>
          <div class="family-front-chips-row">
            ${u.propHouse ? `<span class="front-income-chip chip-labor">주택: <strong>${formatNumber(u.propHouse)}원</strong></span>` : ''}
            ${u.propBuilding ? `<span class="front-income-chip chip-business">건물: <strong>${formatNumber(u.propBuilding)}원</strong></span>` : ''}
            ${u.propLand ? `<span class="front-income-chip chip-finance">토지: <strong>${formatNumber(u.propLand)}원</strong></span>` : ''}
            ${u.propShipPlane ? `<span class="front-income-chip chip-other">선박/항공: <strong>${formatNumber(u.propShipPlane)}원</strong></span>` : ''}
          </div>
        </div>
      `;
    }

    membersWithProp.forEach((m) => {
      const mTotal = calcUserProp(m);
      const relLabel = m.relationship || '세대원';
      cardsHtml += `
        <div class="family-front-card card-family-member">
          <div class="family-front-card-top">
            <div class="family-front-identity">
              <span class="badge-member-tag badge-family-tag">👥 ${relLabel}</span>
              <span class="family-front-total-text"><strong>${formatNumber(mTotal)}원</strong></span>
            </div>
            <div class="family-front-card-actions">
              <button type="button" class="btn-card-action btn-edit-prop-front" data-id="${m.id}">✏️ 수정</button>
              <button type="button" class="btn-card-action text-danger btn-del-prop-front" data-id="${m.id}">🗑️ 삭제</button>
            </div>
          </div>
          <div class="family-front-chips-row">
            ${m.propHouse ? `<span class="front-income-chip chip-labor">주택: <strong>${formatNumber(m.propHouse)}원</strong></span>` : ''}
            ${m.propBuilding ? `<span class="front-income-chip chip-business">건물: <strong>${formatNumber(m.propBuilding)}원</strong></span>` : ''}
            ${m.propLand ? `<span class="front-income-chip chip-finance">토지: <strong>${formatNumber(m.propLand)}원</strong></span>` : ''}
            ${m.propShipPlane ? `<span class="front-income-chip chip-other">선박/항공: <strong>${formatNumber(m.propShipPlane)}원</strong></span>` : ''}
          </div>
        </div>
      `;
    });

    frontContainer.innerHTML = `
      <div class="family-front-members-wrap">
        <div class="family-front-header">
          <h4 class="family-front-title">
            <span>📋 세대원별 재산 등록 현황</span>
            <span class="badge-member-tag badge-primary-tag">${activeCount}명</span>
          </h4>
        </div>
        <div class="family-front-cards-grid">
          ${cardsHtml}
        </div>
      </div>
    `;

    this.bindPropFrontCardEvents();
  }

  bindPropFrontCardEvents() {
    const editBtns = this.container.querySelectorAll('.btn-edit-prop-front');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openInlinePropFormForEdit(id);
      });
    });

    const delBtns = this.container.querySelectorAll('.btn-del-prop-front');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id === 'primary') {
          if (confirm('본인의 등록 재산 내역을 삭제하시겠습니까?')) {
            appState.updatePrimaryUser('propHouse', 0);
            appState.updatePrimaryUser('propBuilding', 0);
            appState.updatePrimaryUser('propLand', 0);
            appState.updatePrimaryUser('propShipPlane', 0);
            appState.updatePrimaryUser('propertyTaxBase', 0);
            appState.saveToStorage();
            this.refreshInputs();
          }
        } else {
          if (confirm('해당 세대원의 재산 내역을 삭제하시겠습니까?')) {
            appState.removeFamilyMember(id);
            appState.saveToStorage();
            this.refreshInputs();
          }
        }
      });
    });
  }

  openInlinePropFormForEdit(id) {
    this.currentEditingPropId = id;
    const state = appState.getState();
    let data = { relationship: '본인', propHouse: 0, propBuilding: 0, propLand: 0, propShipPlane: 0 };
    if (id === 'primary') {
      const u = state.primaryUser;
      data = { relationship: '본인', propHouse: u.propHouse, propBuilding: u.propBuilding, propLand: u.propLand, propShipPlane: u.propShipPlane };
    } else {
      const found = (state.familyMembers || []).find(m => m.id === id);
      if (found) data = { ...found };
    }

    const relSelect = document.getElementById('ci_inline_prop_relationship');
    if (relSelect) relSelect.value = data.relationship || '본인';
    const setValue = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.value = val ? formatNumber(val) : '';
    };
    setValue('ci_inline_prop_house', data.propHouse);
    setValue('ci_inline_prop_building', data.propBuilding);
    setValue('ci_inline_prop_land', data.propLand);
    setValue('ci_inline_prop_shipPlane', data.propShipPlane);

    this.setInlinePropAccordionState(true, `✏️ [${data.relationship}] 재산 정보 수정`);
  }

  setInlinePropAccordionState(open, customTitle = null) {
    const section = document.getElementById('ci_familyPropInlineSection');
    const toggleBtn = document.getElementById('ci_btnToggleFamilyPropInline');
    const titleEl = document.getElementById('ci_inlineFamilyPropFormTitle');
    this.isPropInlineOpen = open;

    if (section) {
      if (open) {
        section.classList.add('is-open');
        if (toggleBtn) toggleBtn.innerHTML = '<span class="person-plus-icon">✕</span> 접기 ▲';
        const relSelect = document.getElementById('ci_inline_prop_relationship');
        const setValue = (elemId, val) => {
          const el = document.getElementById(elemId);
          if (el) el.value = val ? formatNumber(val) : '';
        };

        if (!this.currentEditingPropId) {
          // 신규 열기 시 기본적으로 본인(세대주) 데이터와 직접 연계
          if (relSelect) relSelect.value = '본인';
          const u = appState.getState().primaryUser || {};
          setValue('ci_inline_prop_house', u.propHouse);
          setValue('ci_inline_prop_building', u.propBuilding);
          setValue('ci_inline_prop_land', u.propLand);
          setValue('ci_inline_prop_shipPlane', u.propShipPlane);
          if (titleEl) titleEl.textContent = customTitle || '👤 본인(세대주) 재산 등록 / 수정';
        } else {
          if (titleEl) titleEl.textContent = customTitle || '✏️ 세대원 재산 수정';
        }
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        section.classList.remove('is-open');
        this.currentEditingPropId = null;
        if (toggleBtn) toggleBtn.innerHTML = '<span class="person-plus-icon">👤➕</span> 세대원 재산추가';
      }
    }
  }

  // =========================================================================
  // 2. 소득 세대원 관리 및 전면 노출
  // =========================================================================
  renderRegisteredMembersIncomeFrontView() {
    const frontContainer = document.getElementById('ci_registeredMembersIncomeFrontContainer');
    const state = appState.getState();
    const u = state.primaryUser;
    const familyMembers = state.familyMembers || [];

    const uTotal = (Number(u.businessIncome) || 0) + 
                   (Number(u.laborIncome) || 0) + 
                   (Number(u.interestIncome) || 0) + 
                   (Number(u.dividendIncome) || 0) + 
                   (Number(u.pensionIncome) || 0) + 
                   (Number(u.otherIncome) || 0);

    const membersWithIncome = familyMembers.filter(m => {
      const mTotal = (Number(m.businessIncome) || 0) + 
                     (Number(m.laborIncome) || 0) + 
                     (Number(m.interestIncome) || 0) + 
                     (Number(m.dividendIncome) || 0) + 
                     (Number(m.pensionIncome) || 0) + 
                     (Number(m.otherIncome) || 0);
      return mTotal > 0;
    });

    const activeCount = (uTotal > 0 ? 1 : 0) + membersWithIncome.length;
    const incomeCountBadge = document.getElementById('ci_incomeFrontCountBadge');
    if (incomeCountBadge) incomeCountBadge.textContent = `${activeCount}명`;

    const textEl = document.getElementById('ci_btnToggleIncomeFrontViewText');
    const toggleBtn = document.getElementById('ci_btnToggleIncomeFrontView');
    if (textEl) textEl.textContent = `세대원별 소득 ${this.isIncomeFrontVisible ? '숨기기 ▲' : '보기'}`;
    if (toggleBtn) {
      if (this.isIncomeFrontVisible) toggleBtn.classList.add('active');
      else toggleBtn.classList.remove('active');
    }

    if (!frontContainer) return;
    if (activeCount === 0) {
      frontContainer.innerHTML = '';
      frontContainer.style.display = 'none';
      return;
    }

    frontContainer.style.display = this.isIncomeFrontVisible ? 'block' : 'none';

    let cardsHtml = '';
    if (uTotal > 0) {
      cardsHtml += `
        <div class="family-front-card card-primary-user">
          <div class="family-front-card-top">
            <div class="family-front-identity">
              <span class="badge-member-tag badge-primary-tag">👤 본인 (세대주)</span>
              <span class="family-front-total-text"><strong>${formatNumber(uTotal)}원</strong></span>
            </div>
            <div class="family-front-card-actions">
              <button type="button" class="btn-card-action btn-edit-income-front" data-id="primary">✏️ 수정</button>
              <button type="button" class="btn-card-action text-danger btn-del-income-front" data-id="primary">🗑️ 삭제</button>
            </div>
          </div>
          <div class="family-front-chips-row">
            ${u.laborIncome ? `<span class="front-income-chip chip-labor">근로: <strong>${formatNumber(u.laborIncome)}원</strong></span>` : ''}
            ${u.businessIncome ? `<span class="front-income-chip chip-business">사업: <strong>${formatNumber(u.businessIncome)}원</strong></span>` : ''}
            ${u.pensionIncome ? `<span class="front-income-chip chip-pension">연금: <strong>${formatNumber(u.pensionIncome)}원</strong></span>` : ''}
            ${u.interestIncome ? `<span class="front-income-chip chip-finance">이자: <strong>${formatNumber(u.interestIncome)}원</strong></span>` : ''}
            ${u.dividendIncome ? `<span class="front-income-chip chip-finance">배당: <strong>${formatNumber(u.dividendIncome)}원</strong></span>` : ''}
            ${u.otherIncome ? `<span class="front-income-chip chip-other">기타: <strong>${formatNumber(u.otherIncome)}원</strong></span>` : ''}
          </div>
        </div>
      `;
    }

    membersWithIncome.forEach((m) => {
      const mTotal = (Number(m.businessIncome) || 0) + 
                     (Number(m.laborIncome) || 0) + 
                     (Number(m.interestIncome) || 0) + 
                     (Number(m.dividendIncome) || 0) + 
                     (Number(m.pensionIncome) || 0) + 
                     (Number(m.otherIncome) || 0);
      const relLabel = m.relationship || '세대원';
      cardsHtml += `
        <div class="family-front-card card-family-member">
          <div class="family-front-card-top">
            <div class="family-front-identity">
              <span class="badge-member-tag badge-family-tag">👥 ${relLabel}</span>
              <span class="family-front-total-text"><strong>${formatNumber(mTotal)}원</strong></span>
            </div>
            <div class="family-front-card-actions">
              <button type="button" class="btn-card-action btn-edit-income-front" data-id="${m.id}">✏️ 수정</button>
              <button type="button" class="btn-card-action text-danger btn-del-income-front" data-id="${m.id}">🗑️ 삭제</button>
            </div>
          </div>
          <div class="family-front-chips-row">
            ${m.laborIncome ? `<span class="front-income-chip chip-labor">근로: <strong>${formatNumber(m.laborIncome)}원</strong></span>` : ''}
            ${m.businessIncome ? `<span class="front-income-chip chip-business">사업: <strong>${formatNumber(m.businessIncome)}원</strong></span>` : ''}
            ${m.pensionIncome ? `<span class="front-income-chip chip-pension">연금: <strong>${formatNumber(m.pensionIncome)}원</strong></span>` : ''}
            ${m.interestIncome ? `<span class="front-income-chip chip-finance">이자: <strong>${formatNumber(m.interestIncome)}원</strong></span>` : ''}
            ${m.dividendIncome ? `<span class="front-income-chip chip-finance">배당: <strong>${formatNumber(m.dividendIncome)}원</strong></span>` : ''}
            ${m.otherIncome ? `<span class="front-income-chip chip-other">기타: <strong>${formatNumber(m.otherIncome)}원</strong></span>` : ''}
          </div>
        </div>
      `;
    });

    frontContainer.innerHTML = `
      <div class="family-front-members-wrap">
        <div class="family-front-header">
          <h4 class="family-front-title">
            <span>📋 세대원별 소득 등록 현황</span>
            <span class="badge-member-tag badge-primary-tag">${activeCount}명</span>
          </h4>
        </div>
        <div class="family-front-cards-grid">
          ${cardsHtml}
        </div>
      </div>
    `;

    this.bindIncomeFrontCardEvents();
  }

  bindIncomeFrontCardEvents() {
    const editBtns = this.container.querySelectorAll('.btn-edit-income-front');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openInlineIncomeFormForEdit(id);
      });
    });

    const delBtns = this.container.querySelectorAll('.btn-del-income-front');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id === 'primary') {
          if (confirm('본인의 등록 소득 내역을 삭제하시겠습니까?')) {
            appState.updatePrimaryUser('businessIncome', 0);
            appState.updatePrimaryUser('laborIncome', 0);
            appState.updatePrimaryUser('interestIncome', 0);
            appState.updatePrimaryUser('dividendIncome', 0);
            appState.updatePrimaryUser('pensionIncome', 0);
            appState.updatePrimaryUser('otherIncome', 0);
            appState.saveToStorage();
            this.refreshInputs();
          }
        } else {
          if (confirm('해당 세대원의 소득 내역을 삭제하시겠습니까?')) {
            appState.removeFamilyMember(id);
            appState.saveToStorage();
            this.refreshInputs();
          }
        }
      });
    });
  }

  openInlineIncomeFormForEdit(id) {
    this.currentEditingIncomeId = id;
    const state = appState.getState();
    let data = { relationship: '본인', businessIncome: 0, laborIncome: 0, interestIncome: 0, dividendIncome: 0, pensionIncome: 0, otherIncome: 0 };
    if (id === 'primary') {
      const u = state.primaryUser;
      data = { relationship: '본인', businessIncome: u.businessIncome, laborIncome: u.laborIncome, interestIncome: u.interestIncome, dividendIncome: u.dividendIncome, pensionIncome: u.pensionIncome, otherIncome: u.otherIncome };
    } else {
      const found = (state.familyMembers || []).find(m => m.id === id);
      if (found) data = { ...found };
    }

    const relSelect = document.getElementById('ci_inline_fm_relationship');
    if (relSelect) relSelect.value = data.relationship || '본인';
    const setValue = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.value = val ? formatNumber(val) : '';
    };
    setValue('ci_inline_fm_businessIncome', data.businessIncome);
    setValue('ci_inline_fm_laborIncome', data.laborIncome);
    setValue('ci_inline_fm_interestIncome', data.interestIncome);
    setValue('ci_inline_fm_dividendIncome', data.dividendIncome);
    setValue('ci_inline_fm_pensionIncome', data.pensionIncome);
    setValue('ci_inline_fm_otherIncome', data.otherIncome);

    this.setInlineIncomeAccordionState(true, `✏️ [${data.relationship}] 소득 정보 수정`);
  }

  setInlineIncomeAccordionState(open, customTitle = null) {
    const section = document.getElementById('ci_familyIncomeInlineSection');
    const toggleBtn = document.getElementById('ci_btnToggleFamilyInline');
    const titleEl = document.getElementById('ci_inlineFamilyFormTitle');
    this.isIncomeInlineOpen = open;

    if (section) {
      if (open) {
        section.classList.add('is-open');
        if (toggleBtn) toggleBtn.innerHTML = '<span class="person-plus-icon">✕</span> 접기 ▲';
        const relSelect = document.getElementById('ci_inline_fm_relationship');
        const setValue = (elemId, val) => {
          const el = document.getElementById(elemId);
          if (el) el.value = val ? formatNumber(val) : '';
        };

        if (!this.currentEditingIncomeId) {
          // 신규 열기 시 기본적으로 본인(세대주) 데이터와 직접 연계
          if (relSelect) relSelect.value = '본인';
          const u = appState.getState().primaryUser || {};
          setValue('ci_inline_fm_businessIncome', u.businessIncome);
          setValue('ci_inline_fm_laborIncome', u.laborIncome);
          setValue('ci_inline_fm_interestIncome', u.interestIncome);
          setValue('ci_inline_fm_dividendIncome', u.dividendIncome);
          setValue('ci_inline_fm_pensionIncome', u.pensionIncome);
          setValue('ci_inline_fm_otherIncome', u.otherIncome);
          if (titleEl) titleEl.textContent = customTitle || '👤 본인(세대주) 소득 등록 / 수정';
        } else {
          if (titleEl) titleEl.textContent = customTitle || '✏️ 세대원 소득 수정';
        }
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        section.classList.remove('is-open');
        this.currentEditingIncomeId = null;
        if (toggleBtn) toggleBtn.innerHTML = '<span class="person-plus-icon">👤➕</span> 세대원 소득추가';
      }
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="menu-view-card">
        <!-- 1. 1: 재산세과세표준 (4개 항목 + 세대원 추가 + Check 박스) -->
        <div class="form-section step-form-section mt-1">
          <div class="section-title-row title-row-responsive">
            <h3 class="section-title">
              <span class="step-circle-badge">1</span>
              <span>재산세과세표준</span>
            </h3>
          </div>

          <!-- 재산 4대 합계 인풋 그리드 (본인 기본 입력란) -->
          <div class="form-grid mt-2">
            <!-- 1. 아파트(주택) -->
            <div class="form-group">
              <label class="form-label" for="ci_propHouse"><span>아파트(주택)</span></label>
              <div class="input-wrapper">
                <input type="text" inputmode="numeric" id="ci_propHouse" class="form-control money-input" placeholder="0">
              </div>
            </div>

            <!-- 2. 건물 -->
            <div class="form-group">
              <label class="form-label" for="ci_propBuilding"><span>건물</span></label>
              <div class="input-wrapper">
                <input type="text" inputmode="numeric" id="ci_propBuilding" class="form-control money-input" placeholder="0">
              </div>
            </div>

            <!-- 3. 토지 -->
            <div class="form-group">
              <label class="form-label" for="ci_propLand"><span>토지</span></label>
              <div class="input-wrapper">
                <input type="text" inputmode="numeric" id="ci_propLand" class="form-control money-input" placeholder="0">
              </div>
            </div>

            <!-- 4. 선박/항공기 -->
            <div class="form-group">
              <label class="form-label" for="ci_propShipPlane"><span>선박/항공기</span></label>
              <div class="input-wrapper">
                <input type="text" inputmode="numeric" id="ci_propShipPlane" class="form-control money-input" placeholder="0">
              </div>
            </div>
          </div>

          <!-- [재산 액션 툴바: 3개 버튼 1행 배치] -->
          <div class="step-actions-toolbar step-actions-toolbar-3col mt-2">
            <button type="button" class="btn-step-action btn-toggle-front-view" id="ci_btnTogglePropFrontView">
              <span class="btn-toggle-icon">📋</span>
              <span id="ci_btnTogglePropFrontViewText">세대원별 재산 보기</span>
              <span class="front-view-count-badge" id="ci_propFrontCountBadge">0명</span>
            </button>
            <button type="button" class="btn-step-action btn-add-family" id="ci_btnToggleFamilyPropInline">
              <span class="person-plus-icon">👤➕</span>
              <span id="ci_btnToggleFamilyPropInlineText">세대원 재산추가</span>
            </button>
            <button type="button" class="btn-step-action btn-checkpoint-toggle" id="ci_btnTogglePropCheckpoint">
              <span class="checkpoint-icon">💡</span>
              <span>CHECKPOINT</span>
            </button>
          </div>

          <!-- 세대원 재산 추가/수정 인라인 아코디언 폼 -->
          <div id="ci_familyPropInlineSection" class="family-inline-section">
            <div class="family-inline-card">
              <div class="family-inline-header">
                <h4 class="family-inline-title" id="ci_inlineFamilyPropFormTitle">➕ 세대원 재산 추가</h4>
              </div>

              <div class="form-group form-group-compact full-col">
                <label class="form-label" for="ci_inline_prop_relationship"><span>세대원 구분 (관계 선택)</span></label>
                <select id="ci_inline_prop_relationship" class="form-control">
                  <option value="본인" selected>👤 본인(세대주)</option>
                  <option value="배우자">👩 배우자</option>
                  <option value="자녀">👦 자녀</option>
                  <option value="부모">👵 부모 (직계존속)</option>
                  <option value="형제자매">🧑 형제자매</option>
                  <option value="기타 세대원">👥 기타 세대원</option>
                </select>
              </div>

              <div class="modal-income-grid-compact mt-1">
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_prop_house"><span>아파트(주택)</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_prop_house" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_prop_building"><span>건물</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_prop_building" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_prop_land"><span>토지</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_prop_land" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_prop_shipPlane"><span>선박/항공기</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_prop_shipPlane" class="form-control money-input" placeholder="0"></div>
                </div>
              </div>

              <div class="family-inline-actions">
                <button type="button" class="btn btn-outline-secondary btn-sm" id="ci_btnCancelInlineFamilyProp">취소 / 접기</button>
                <button type="button" class="btn btn-success btn-sm flex-1 font-bold" id="ci_btnSaveInlineFamilyProp">
                  💾 세대원 재산 저장 (합계 반영)
                </button>
              </div>
            </div>
          </div>

          <!-- 등록 세대원 재산 전면 노출 카드 뷰 -->
          <div id="ci_registeredMembersPropFrontContainer"></div>

          <!-- [재산 CHECKPOINT 토글 안내 박스] -->
          <div id="ci_propCheckpointBox" class="guide-check-box mt-2" style="display: none;">
            <div class="check-guide-line">
              <svg class="check-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056b3" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <div class="check-guide-text">매년 7월/9월 '재산세 납부고지서' 또는 위택스(Wetax)/서울시 이택스(ETAX)의 '지방세 세목별 과세증명서'의 [과세표준]항목 확인</div>
            </div>
            <div class="check-guide-line mt-1-5">
              <svg class="check-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056b3" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <div class="check-guide-text">당해년도 재산세 과세표준은 당해년도 11월 건보공단에 반영하여 바로 갱신</div>
            </div>
          </div>
        </div>

        <!-- 2. 2: 총 연간소득 (6개 항목 + 세대원 추가 + CHECKPOINT) -->
        <div class="form-section step-form-section mt-3">
          <div class="section-title-row title-row-responsive">
            <h3 class="section-title">
              <span class="step-circle-badge">2</span>
              <span>총 연간소득</span>
            </h3>
          </div>

          <!-- 소득 6대 합계 인풋 그리드 (본인 기본 입력란) -->
          <div class="form-grid mt-2">
            <!-- 1. 사업소득(임대소득) -->
            <div class="form-group">
              <label class="form-label" for="ci_businessIncome"><span>사업소득(임대소득)</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_businessIncome" class="form-control money-input" placeholder="0"></div>
            </div>

            <!-- 2. 근로소득 -->
            <div class="form-group">
              <label class="form-label" for="ci_laborIncome"><span>근로소득</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_laborIncome" class="form-control money-input" placeholder="0"></div>
            </div>

            <!-- 3. 이자소득 -->
            <div class="form-group">
              <label class="form-label" for="ci_interestIncome"><span>이자소득</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_interestIncome" class="form-control money-input" placeholder="0"></div>
            </div>

            <!-- 4. 배당(금융소득) -->
            <div class="form-group">
              <label class="form-label" for="ci_dividendIncome"><span>배당(금융소득)</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_dividendIncome" class="form-control money-input" placeholder="0"></div>
            </div>

            <!-- 5. 공적연금 -->
            <div class="form-group">
              <label class="form-label" for="ci_pensionIncome"><span>공적연금</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_pensionIncome" class="form-control money-input" placeholder="0"></div>
            </div>

            <!-- 6. 기타소득 -->
            <div class="form-group">
              <label class="form-label" for="ci_otherIncome"><span>기타소득</span></label>
              <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_otherIncome" class="form-control money-input" placeholder="0"></div>
            </div>
          </div>

          <!-- [소득 액션 툴바: 3개 버튼 1행 배치] -->
          <div class="step-actions-toolbar step-actions-toolbar-3col mt-2">
            <button type="button" class="btn-step-action btn-toggle-front-view" id="ci_btnToggleIncomeFrontView">
              <span class="btn-toggle-icon">📋</span>
              <span id="ci_btnToggleIncomeFrontViewText">세대원별 소득 보기</span>
              <span class="front-view-count-badge" id="ci_incomeFrontCountBadge">0명</span>
            </button>
            <button type="button" class="btn-step-action btn-add-family" id="ci_btnToggleFamilyInline">
              <span class="person-plus-icon">👤➕</span>
              <span id="ci_btnToggleFamilyInlineText">세대원 소득추가</span>
            </button>
            <button type="button" class="btn-step-action btn-checkpoint-toggle" id="ci_btnToggleIncomeCheckpoint">
              <span class="checkpoint-icon">💡</span>
              <span>CHECKPOINT</span>
            </button>
          </div>

          <!-- 세대원 소득 추가/수정 인라인 아코디언 폼 -->
          <div id="ci_familyIncomeInlineSection" class="family-inline-section">
            <div class="family-inline-card">
              <div class="family-inline-header">
                <h4 class="family-inline-title" id="ci_inlineFamilyFormTitle">➕ 세대원 소득 추가</h4>
              </div>

              <div class="form-group form-group-compact full-col">
                <label class="form-label" for="ci_inline_fm_relationship"><span>세대원 구분 (관계 선택)</span></label>
                <select id="ci_inline_fm_relationship" class="form-control">
                  <option value="본인" selected>👤 본인(세대주)</option>
                  <option value="배우자">👩 배우자</option>
                  <option value="자녀">👦 자녀</option>
                  <option value="부모">👵 부모 (직계존속)</option>
                  <option value="형제자매">🧑 형제자매</option>
                  <option value="기타 세대원">👥 기타 세대원</option>
                </select>
              </div>

              <div class="modal-income-grid-compact mt-1">
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_businessIncome"><span>사업소득(임대소득)</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_businessIncome" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_laborIncome"><span>근로소득</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_laborIncome" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_interestIncome"><span>이자소득</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_interestIncome" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_dividendIncome"><span>배당(금융소득)</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_dividendIncome" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_pensionIncome"><span>공적연금</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_pensionIncome" class="form-control money-input" placeholder="0"></div>
                </div>
                <div class="form-group form-group-compact">
                  <label class="form-label" for="ci_inline_fm_otherIncome"><span>기타소득</span></label>
                  <div class="input-wrapper"><input type="text" inputmode="numeric" id="ci_inline_fm_otherIncome" class="form-control money-input" placeholder="0"></div>
                </div>
              </div>

              <div class="family-inline-actions">
                <button type="button" class="btn btn-outline-secondary btn-sm" id="ci_btnCancelInlineFamily">취소 / 접기</button>
                <button type="button" class="btn btn-success btn-sm flex-1 font-bold" id="ci_btnSaveInlineFamily">
                  💾 세대원 소득 저장 (합계 반영)
                </button>
              </div>
            </div>
          </div>

          <!-- 등록 세대원 소득 전면 노출 카드 뷰 -->
          <div id="ci_registeredMembersIncomeFrontContainer"></div>

          <!-- [소득 CHECKPOINT 토글 안내 박스] -->
          <div id="ci_incomeCheckpointBox" class="guide-check-box mt-2" style="display: none;">
            <div class="check-guide-line">
              <svg class="check-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056b3" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <div class="check-guide-text">매년 11월 국세청(세무서)으로부터 전년도 귀속 종합소득세 확정 데이터를 일괄 연동</div>
            </div>
            <div class="check-guide-line mt-1-5">
              <svg class="check-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056b3" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <div class="check-guide-text">직전 연도(작년 1년 동안의 귀속분) 소득은 그 다음해 7월에는 개인 확인 가능(자격유지를 위해 사전에 확인 필수)</div>
            </div>
            <div class="check-bullet-list">
              <div class="check-bullet-item">
                <span class="check-bullet-dot">•</span>
                <div class="check-bullet-content">
                  <strong class="check-bullet-label">연금소득:</strong>
                  <span class="check-bullet-desc">국민연금, 공무원·군인·사학연금 등 공적연금만 포함되며, 개인연금저축/IRP 등 사적연금은 제외</span>
                </div>
              </div>
              <div class="check-bullet-item">
                <span class="check-bullet-dot">•</span>
                <div class="check-bullet-content">
                  <strong class="check-bullet-label">금융소득:</strong>
                  <span class="check-bullet-desc">국세청 홈택스에서 조회 가능(당해년도 7월 1일 부터 조회 가능)(금융기관에서 별도 확인 필수)</span>
                </div>
              </div>
              <div class="check-bullet-item">
                <span class="check-bullet-dot">•</span>
                <div class="check-bullet-content">
                  <strong class="check-bullet-label">기타소득:</strong>
                  <span class="check-bullet-desc">복권 당첨금, 원고료, 강연료, 자문료 등의 필요경비 차감 후의 소득금액</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 퇴직 전 직장 건강보험료 (장기요양 포함) -->
        <div class="form-section step-form-section mt-3">
          <div class="section-title-row">
            <h3 class="section-title">
              <span class="step-circle-badge">3</span>
              <span>퇴직 전 직장 본인부담 건강보험료 (장기요양 포함)</span>
            </h3>
          </div>
          <div class="form-group mt-2">
            <div class="input-wrapper">
              <input type="text" inputmode="numeric" id="ci_prevWorkHealthFee" class="form-control money-input" placeholder="0">
            </div>
          </div>
        </div>

        <!-- 하단 전용 액션 툴바: 전체 초기화 버튼 -->
        <div class="common-input-bottom-actions mt-3">
          <button type="button" class="btn btn-subtle-reset w-full" id="btnResetAllInputs">
            <span>🔄 입력값 전체 초기화 (새로 계산하기)</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. 재산 4개 세부 항목 입력 (세대 합산 및 본인 몫 자동 계산)
    const propIds = ['ci_propHouse', 'ci_propBuilding', 'ci_propLand', 'ci_propShipPlane'];
    const handlePropChange = () => {
      const getVal = (id) => {
        const raw = (document.getElementById(id)?.value || '').replace(/[^0-9]/g, '');
        return Number(raw) || 0;
      };
      const totalHouse = getVal('ci_propHouse');
      const totalBuilding = getVal('ci_propBuilding');
      const totalLand = getVal('ci_propLand');
      const totalShipPlane = getVal('ci_propShipPlane');

      // 세대원들의 등록 재산 합산
      const state = appState.getState();
      let familyHouse = 0, familyBuilding = 0, familyLand = 0, familyShipPlane = 0;
      (state.familyMembers || []).forEach(m => {
        familyHouse += Number(m.propHouse) || 0;
        familyBuilding += Number(m.propBuilding) || 0;
        familyLand += Number(m.propLand) || 0;
        familyShipPlane += Number(m.propShipPlane) || 0;
      });

      // 본인(primaryUser) 몫 = 입력된 세대 합산 - 세대원 합산 (최소 0)
      const primaryHouse = Math.max(0, totalHouse - familyHouse);
      const primaryBuilding = Math.max(0, totalBuilding - familyBuilding);
      const primaryLand = Math.max(0, totalLand - familyLand);
      const primaryShipPlane = Math.max(0, totalShipPlane - familyShipPlane);

      appState.state.primaryUser.propHouse = primaryHouse;
      appState.state.primaryUser.propBuilding = primaryBuilding;
      appState.state.primaryUser.propLand = primaryLand;
      appState.state.primaryUser.propShipPlane = primaryShipPlane;
      appState.state.primaryUser.propertyTaxBase = primaryHouse + primaryBuilding + primaryLand + primaryShipPlane;

      appState.saveToStorage();
      this.updateSummaryBar();
      this.renderRegisteredMembersPropFrontView();
      appState.notify('all');
    };

    propIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(raw) || 0;
        e.target.value = raw ? formatNumber(val) : '';
        handlePropChange();
      });
    });

    // 인라인 재산 입력란 자동 콤마 서식화
    const inlinePropIds = ['ci_inline_prop_house', 'ci_inline_prop_building', 'ci_inline_prop_land', 'ci_inline_prop_shipPlane'];
    inlinePropIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(raw) || 0;
        e.target.value = raw ? formatNumber(val) : '';
      });
    });

    // 2. 소득 6개 세부 항목 입력 (세대 합산 및 본인 몫 자동 계산)
    const incomeIds = [
      'ci_businessIncome', 'ci_laborIncome', 'ci_interestIncome',
      'ci_dividendIncome', 'ci_pensionIncome', 'ci_otherIncome'
    ];
    const handleIncomeChange = () => {
      const getVal = (id) => {
        const raw = (document.getElementById(id)?.value || '').replace(/[^0-9]/g, '');
        return Number(raw) || 0;
      };
      const totalBus = getVal('ci_businessIncome');
      const totalLabor = getVal('ci_laborIncome');
      const totalInterest = getVal('ci_interestIncome');
      const totalDiv = getVal('ci_dividendIncome');
      const totalPension = getVal('ci_pensionIncome');
      const totalOther = getVal('ci_otherIncome');

      // 세대원들의 등록 소득 합산
      const state = appState.getState();
      let familyBus = 0, familyLabor = 0, familyInterest = 0, familyDiv = 0, familyPension = 0, familyOther = 0;
      (state.familyMembers || []).forEach(m => {
        familyBus += Number(m.businessIncome) || 0;
        familyLabor += Number(m.laborIncome) || 0;
        familyInterest += Number(m.interestIncome) || 0;
        familyDiv += Number(m.dividendIncome) || 0;
        familyPension += Number(m.pensionIncome) || 0;
        familyOther += Number(m.otherIncome) || 0;
      });

      // 본인(primaryUser) 몫 = 입력된 세대 합산 - 세대원 합산 (최소 0)
      appState.state.primaryUser.businessIncome = Math.max(0, totalBus - familyBus);
      appState.state.primaryUser.laborIncome = Math.max(0, totalLabor - familyLabor);
      appState.state.primaryUser.interestIncome = Math.max(0, totalInterest - familyInterest);
      appState.state.primaryUser.dividendIncome = Math.max(0, totalDiv - familyDiv);
      appState.state.primaryUser.pensionIncome = Math.max(0, totalPension - familyPension);
      appState.state.primaryUser.otherIncome = Math.max(0, totalOther - familyOther);

      appState.saveToStorage();
      this.updateSummaryBar();
      this.renderRegisteredMembersIncomeFrontView();
      appState.notify('all');
    };

    incomeIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(raw) || 0;
        e.target.value = raw ? formatNumber(val) : '';
        handleIncomeChange();
      });
    });

    // 인라인 소득 입력란 자동 콤마 서식화
    const inlineIncomeIds = [
      'ci_inline_fm_businessIncome', 'ci_inline_fm_laborIncome', 'ci_inline_fm_interestIncome',
      'ci_inline_fm_dividendIncome', 'ci_inline_fm_pensionIncome', 'ci_inline_fm_otherIncome'
    ];
    inlineIncomeIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(raw) || 0;
        e.target.value = raw ? formatNumber(val) : '';
      });
    });

    // 재산 세대원 토글 및 저장/취소
    const btnTogglePropInline = document.getElementById('ci_btnToggleFamilyPropInline');
    if (btnTogglePropInline) {
      btnTogglePropInline.addEventListener('click', () => {
        this.setInlinePropAccordionState(!this.isPropInlineOpen);
      });
    }

    // 재산 관계 선택 변경 시 본인 데이터 즉시 연계 또는 세대원 입력 모드 전환
    const relPropSelect = document.getElementById('ci_inline_prop_relationship');
    if (relPropSelect) {
      relPropSelect.addEventListener('change', (e) => {
        const rel = e.target.value;
        const titleEl = document.getElementById('ci_inlineFamilyPropFormTitle');
        const setValue = (elemId, val) => {
          const el = document.getElementById(elemId);
          if (el) el.value = val ? formatNumber(val) : '';
        };
        if (rel === '본인') {
          if (titleEl) titleEl.textContent = '👤 본인(세대주) 재산 등록 / 수정';
          const u = appState.getState().primaryUser || {};
          setValue('ci_inline_prop_house', u.propHouse);
          setValue('ci_inline_prop_building', u.propBuilding);
          setValue('ci_inline_prop_land', u.propLand);
          setValue('ci_inline_prop_shipPlane', u.propShipPlane);
        } else {
          if (!this.currentEditingPropId || this.currentEditingPropId === 'primary') {
            if (titleEl) titleEl.textContent = `➕ [${rel}] 세대원 재산 추가`;
            setValue('ci_inline_prop_house', 0);
            setValue('ci_inline_prop_building', 0);
            setValue('ci_inline_prop_land', 0);
            setValue('ci_inline_prop_shipPlane', 0);
          } else {
            if (titleEl) titleEl.textContent = `✏️ [${rel}] 세대원 재산 수정`;
          }
        }
      });
    }

    const btnCancelPropInline = document.getElementById('ci_btnCancelInlineFamilyProp');
    if (btnCancelPropInline) {
      btnCancelPropInline.addEventListener('click', () => this.setInlinePropAccordionState(false));
    }

    const btnSavePropInline = document.getElementById('ci_btnSaveInlineFamilyProp');
    if (btnSavePropInline) {
      btnSavePropInline.addEventListener('click', () => {
        const getVal = (id) => Number((document.getElementById(id)?.value || '').replace(/[^0-9]/g, '')) || 0;
        const rel = document.getElementById('ci_inline_prop_relationship')?.value || '본인';
        const house = getVal('ci_inline_prop_house');
        const building = getVal('ci_inline_prop_building');
        const land = getVal('ci_inline_prop_land');
        const shipPlane = getVal('ci_inline_prop_shipPlane');

        if (this.currentEditingPropId === 'primary' || rel === '본인') {
          // 기존 세대원 카드를 수정하면서 본인으로 변경한 경우 기존 세대원 삭제
          if (this.currentEditingPropId && this.currentEditingPropId !== 'primary') {
            appState.removeFamilyMember(this.currentEditingPropId);
          }
          appState.state.primaryUser.propHouse = house;
          appState.state.primaryUser.propBuilding = building;
          appState.state.primaryUser.propLand = land;
          appState.state.primaryUser.propShipPlane = shipPlane;
          appState.state.primaryUser.propertyTaxBase = house + building + land + shipPlane;
        } else if (this.currentEditingPropId) {
          // 기존 세대원 수정
          appState.updateFamilyMember(this.currentEditingPropId, 'relationship', rel);
          appState.updateFamilyMember(this.currentEditingPropId, 'propHouse', house);
          appState.updateFamilyMember(this.currentEditingPropId, 'propBuilding', building);
          appState.updateFamilyMember(this.currentEditingPropId, 'propLand', land);
          appState.updateFamilyMember(this.currentEditingPropId, 'propShipPlane', shipPlane);
          appState.updateFamilyMember(this.currentEditingPropId, 'propertyTaxBase', house + building + land + shipPlane);
        } else {
          // 신규 세대원 추가
          appState.addFamilyMember({
            relationship: rel,
            propHouse: house,
            propBuilding: building,
            propLand: land,
            propShipPlane: shipPlane,
            propertyTaxBase: house + building + land + shipPlane,
          });
        }

        appState.saveToStorage();
        this.setInlinePropAccordionState(false);
        this.refreshInputs();
        this.updateSummaryBar();
        appState.notify('all');
        this.showToast('✅ 재산 정보가 저장되어 입력란 및 상단 요약에 반영되었습니다.');
      });
    }

    const btnTogglePropFront = document.getElementById('ci_btnTogglePropFrontView');
    if (btnTogglePropFront) {
      btnTogglePropFront.addEventListener('click', () => {
        this.isPropFrontVisible = !this.isPropFrontVisible;
        const container = document.getElementById('ci_registeredMembersPropFrontContainer');
        const textEl = document.getElementById('ci_btnTogglePropFrontViewText');
        if (container) container.style.display = this.isPropFrontVisible ? 'block' : 'none';
        if (textEl) textEl.textContent = `세대원별 재산 ${this.isPropFrontVisible ? '숨기기 ▲' : '보기'}`;
        if (this.isPropFrontVisible) btnTogglePropFront.classList.add('active');
        else btnTogglePropFront.classList.remove('active');
      });
    }

    // 재산 CHECKPOINT 토글 버튼 이벤트
    const btnPropCheckpoint = document.getElementById('ci_btnTogglePropCheckpoint');
    if (btnPropCheckpoint) {
      btnPropCheckpoint.addEventListener('click', () => {
        this.isPropCheckpointOpen = !this.isPropCheckpointOpen;
        const box = document.getElementById('ci_propCheckpointBox');
        if (box) box.style.display = this.isPropCheckpointOpen ? 'block' : 'none';
        if (this.isPropCheckpointOpen) {
          btnPropCheckpoint.classList.add('active');
          box?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          btnPropCheckpoint.classList.remove('active');
        }
      });
    }

    // 소득 세대원 토글 및 저장/취소
    const btnToggleIncomeInline = document.getElementById('ci_btnToggleFamilyInline');
    if (btnToggleIncomeInline) {
      btnToggleIncomeInline.addEventListener('click', () => {
        this.setInlineIncomeAccordionState(!this.isIncomeInlineOpen);
      });
    }

    // 소득 관계 선택 변경 시 본인 데이터 즉시 연계 또는 세대원 입력 모드 전환
    const relIncomeSelect = document.getElementById('ci_inline_fm_relationship');
    if (relIncomeSelect) {
      relIncomeSelect.addEventListener('change', (e) => {
        const rel = e.target.value;
        const titleEl = document.getElementById('ci_inlineFamilyFormTitle');
        const setValue = (elemId, val) => {
          const el = document.getElementById(elemId);
          if (el) el.value = val ? formatNumber(val) : '';
        };
        if (rel === '본인') {
          if (titleEl) titleEl.textContent = '👤 본인(세대주) 소득 등록 / 수정';
          const u = appState.getState().primaryUser || {};
          setValue('ci_inline_fm_businessIncome', u.businessIncome);
          setValue('ci_inline_fm_laborIncome', u.laborIncome);
          setValue('ci_inline_fm_interestIncome', u.interestIncome);
          setValue('ci_inline_fm_dividendIncome', u.dividendIncome);
          setValue('ci_inline_fm_pensionIncome', u.pensionIncome);
          setValue('ci_inline_fm_otherIncome', u.otherIncome);
        } else {
          if (!this.currentEditingIncomeId || this.currentEditingIncomeId === 'primary') {
            if (titleEl) titleEl.textContent = `➕ [${rel}] 세대원 소득 추가`;
            setValue('ci_inline_fm_businessIncome', 0);
            setValue('ci_inline_fm_laborIncome', 0);
            setValue('ci_inline_fm_interestIncome', 0);
            setValue('ci_inline_fm_dividendIncome', 0);
            setValue('ci_inline_fm_pensionIncome', 0);
            setValue('ci_inline_fm_otherIncome', 0);
          } else {
            if (titleEl) titleEl.textContent = `✏️ [${rel}] 세대원 소득 수정`;
          }
        }
      });
    }

    const btnCancelIncomeInline = document.getElementById('ci_btnCancelInlineFamily');
    if (btnCancelIncomeInline) {
      btnCancelIncomeInline.addEventListener('click', () => this.setInlineIncomeAccordionState(false));
    }

    const btnSaveIncomeInline = document.getElementById('ci_btnSaveInlineFamily');
    if (btnSaveIncomeInline) {
      btnSaveIncomeInline.addEventListener('click', () => {
        const getVal = (id) => Number((document.getElementById(id)?.value || '').replace(/[^0-9]/g, '')) || 0;
        const rel = document.getElementById('ci_inline_fm_relationship')?.value || '본인';
        const bus = getVal('ci_inline_fm_businessIncome');
        const labor = getVal('ci_inline_fm_laborIncome');
        const interest = getVal('ci_inline_fm_interestIncome');
        const div = getVal('ci_inline_fm_dividendIncome');
        const pension = getVal('ci_inline_fm_pensionIncome');
        const other = getVal('ci_inline_fm_otherIncome');

        if (this.currentEditingIncomeId === 'primary' || rel === '본인') {
          // 기존 세대원 카드를 수정하면서 본인으로 변경한 경우 기존 세대원 삭제
          if (this.currentEditingIncomeId && this.currentEditingIncomeId !== 'primary') {
            appState.removeFamilyMember(this.currentEditingIncomeId);
          }
          appState.state.primaryUser.businessIncome = bus;
          appState.state.primaryUser.laborIncome = labor;
          appState.state.primaryUser.interestIncome = interest;
          appState.state.primaryUser.dividendIncome = div;
          appState.state.primaryUser.pensionIncome = pension;
          appState.state.primaryUser.otherIncome = other;
        } else if (this.currentEditingIncomeId) {
          // 기존 세대원 수정
          appState.updateFamilyMember(this.currentEditingIncomeId, 'relationship', rel);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'businessIncome', bus);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'laborIncome', labor);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'interestIncome', interest);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'dividendIncome', div);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'pensionIncome', pension);
          appState.updateFamilyMember(this.currentEditingIncomeId, 'otherIncome', other);
        } else {
          // 신규 세대원 추가
          appState.addFamilyMember({
            relationship: rel,
            businessIncome: bus,
            laborIncome: labor,
            interestIncome: interest,
            dividendIncome: div,
            pensionIncome: pension,
            otherIncome: other,
          });
        }

        appState.saveToStorage();
        this.setInlineIncomeAccordionState(false);
        this.refreshInputs();
        this.updateSummaryBar();
        appState.notify('all');
        this.showToast('✅ 소득 정보가 저장되어 입력란 및 상단 요약에 반영되었습니다.');
      });
    }

    const btnToggleIncomeFront = document.getElementById('ci_btnToggleIncomeFrontView');
    if (btnToggleIncomeFront) {
      btnToggleIncomeFront.addEventListener('click', () => {
        this.isIncomeFrontVisible = !this.isIncomeFrontVisible;
        const container = document.getElementById('ci_registeredMembersIncomeFrontContainer');
        const textEl = document.getElementById('ci_btnToggleIncomeFrontViewText');
        if (container) container.style.display = this.isIncomeFrontVisible ? 'block' : 'none';
        if (textEl) textEl.textContent = `세대원별 소득 ${this.isIncomeFrontVisible ? '숨기기 ▲' : '보기'}`;
        if (this.isIncomeFrontVisible) btnToggleIncomeFront.classList.add('active');
        else btnToggleIncomeFront.classList.remove('active');
      });
    }

    // 소득 CHECKPOINT 토글 버튼 이벤트
    const btnIncomeCheckpoint = document.getElementById('ci_btnToggleIncomeCheckpoint');
    if (btnIncomeCheckpoint) {
      btnIncomeCheckpoint.addEventListener('click', () => {
        this.isIncomeCheckpointOpen = !this.isIncomeCheckpointOpen;
        const box = document.getElementById('ci_incomeCheckpointBox');
        if (box) box.style.display = this.isIncomeCheckpointOpen ? 'block' : 'none';
        if (this.isIncomeCheckpointOpen) {
          btnIncomeCheckpoint.classList.add('active');
          box?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          btnIncomeCheckpoint.classList.remove('active');
        }
      });
    }
    // 퇴직 전 직장보험료 입력 바인딩 (자동 실시간 저장 및 동기화)
    const prevFeeInput = document.getElementById('ci_prevWorkHealthFee');
    if (prevFeeInput) {
      prevFeeInput.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(raw) || 0;
        e.target.value = raw ? formatNumber(val) : '';
        appState.updateVoluntary('prevWorkHealthFee', val);
        appState.saveToStorage();
        appState.notify('voluntary');
      });
    }

    // 입력값 전체 초기화 버튼 바인딩
    const btnResetAll = document.getElementById('btnResetAllInputs');
    if (btnResetAll) {
      btnResetAll.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('입력하신 모든 재산 및 소득 정보를 초기화하시겠습니까?\n(등록된 세대원 정보도 함께 초기화됩니다)')) {
          appState.reset();
          this.isPropInlineOpen = false;
          this.isIncomeIncomeOpen = false;
          this.currentEditingPropId = null;
          this.currentEditingIncomeId = null;
          this.render();
          this.refreshInputs();
          this.updateSummaryBar();
          this.showToast('🔄 모든 입력값이 깨끗하게 초기화되었습니다.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }
}

