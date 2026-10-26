/**
 * [메뉴 1] 피부양자 자격 확인 모듈 (menu1Dependent.js)
 * 
 * 1. 상단 단일 제목 배너 (본인(개별계산) 뱃지 중첩)
 * 2. 상단 3단 기준표: 기준 ①(5.4억 이하), 기준 ②(5.4억~9억), 기준 ③(사업자등록 토글 내장)
 * 3. 하단 최종결과 박스:
 *    - 재산세 과세표준 게이지바 (10억 스케일, 실시간 마커)
 *    - 연간 합산 소득 게이지바 (2,500만 스케일, 실시간 마커)
 *    - 상태 버튼 (🟢 등록가능(부양자 신청필요) / 🔴 탈락)
 *    - [💰 지역가입자 예상보험료 ➔] 이동 버튼
 *    - [💾 저장], [🔄 초기화] 툴바
 * 4. 최하단 [주요사항] 안내 카드 (체크박스 아이콘 및 4개 핵심 안내)
 */

import { appState } from '../state.js?v=20260921_01';
import { QualificationGauge } from '../components/gaugeBar.js?v=20260921_01';

export class Menu1DependentModule {
  constructor(containerId, onNavigateToMenu2, onBackToDiagnosis) {
    this.container = document.getElementById(containerId);
    this.onNavigateToMenu2 = onNavigateToMenu2;
    this.onBackToDiagnosis = onBackToDiagnosis;
    this.gauge = null;
  }

  init() {
    this.render();
    this.gauge = new QualificationGauge(
      'menu1GaugeContainer', 
      'menu1CriteriaContainer', 
      () => {
        if (this.onNavigateToMenu2) this.onNavigateToMenu2();
      },
      () => {
        // onSave
        appState.saveToStorage();
        this.showToast('✅ 정보가 안전하게 저장되었습니다.');
      },
      () => {
        // onReset
        if (confirm('입력하신 재산과 소득 정보를 모두 초기화하시겠습니까?')) {
          appState.reset();
          this.updateGauge();
          this.showToast('🔄 모든 입력값이 초기화되었습니다.');
        }
      }
    );
    this.updateGauge();
    this.bindEvents();
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

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="menu-view-card">
        <!-- 1. 최상단 박스형 단일 제목 배너 (본인(개별계산) 뱃지 중첩) -->
        <div class="top-title-banner top-title-banner-nested">
          <span class="banner-nested-badge">본인(개별계산)</span>
          <span class="banner-icon">👤</span>
          <span class="banner-text">재산세 과세표준과 연소득 한도 기준에 부합하는 경우 피부양자로 등록 가능</span>
        </div>

        <!-- 2. 상단 3단 기준표 (설명칸 밑 배치) -->
        <div id="menu1CriteriaContainer" class="mt-2"></div>

        <!-- 3. 하단 최종결과 점선 진행바 및 저장/초기화 툴바 컨테이너 -->
        <div id="menu1GaugeContainer" class="mt-2"></div>

        <!-- 4. 최하단 [주요사항] 안내 카드 -->
        <div class="key-points-card mt-3">
          <div class="key-points-header">
            <div class="kp-header-title-wrap">
              <span class="key-points-badge-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </span>
              <h4 class="key-points-title">주요사항</h4>
            </div>
          </div>
          
          <div class="key-points-list">
            <!-- 1행: 부양자 -->
            <div class="key-point-item">
              <div class="kp-icon-box" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div class="kp-content">
                <span class="kp-label">부양자</span>
                <span class="kp-arrow">➔</span>
                <span class="kp-text">피부양자(본인 및 기 등록자) 등록 신청</span>
              </div>
            </div>

            <!-- 2행: 필수서류 -->
            <div class="key-point-item">
              <div class="kp-icon-box" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div class="kp-content">
                <span class="kp-label">필수서류</span>
                <span class="kp-arrow">➔</span>
                <span class="kp-text">과세표준확정신고서, 소득금액증명서(홈택스)</span>
              </div>
            </div>

            <!-- 3행: 자격심사 -->
            <div class="key-point-item">
              <div class="kp-icon-box" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div class="kp-content">
                <span class="kp-label">자격심사</span>
                <span class="kp-arrow">➔</span>
                <span class="kp-text">매년 1월 피부양자 자격심사</span>
              </div>
            </div>

            <!-- 4행: 자격유지 -->
            <div class="key-point-item">
              <div class="kp-icon-box" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div class="kp-content">
                <span class="kp-label">자격유지</span>
                <span class="kp-arrow">➔</span>
                <span class="kp-text">재산과표와 소득 1,000만원 미만</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  updateGauge() {
    const state = appState.getState();
    const u = state.primaryUser;
    const indivProp = appState.getIndividualPropertyTotal();
    const indivIncome = appState.getIndividualIncomeTotal();

    if (this.gauge) {
      this.gauge.render({
        totalIncome: indivIncome,
        propertyTaxBase: indivProp,
        hasBusinessReg: u.hasBusinessReg,
        businessIncome: Number(u.businessIncome) || 0,
      });
    }
  }

  bindEvents() {
    // 이벤트 바인딩 필요 시 확장
  }
}
