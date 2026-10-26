/**
 * 자격기준 점선 및 실시간 금액 표기 게이지바 & 기준표 컴포넌트
 * 
 * 1. 상단 기준표 (설명칸 밑 배치)
 * 2. 최종결과 섹션:
 *    - [상단] 🏠 재산세 과세표준 게이지바 (총길이 10억, 9.0억 정확한 비례 배치 및 틱 정렬)
 *    - [하단] 💵 연간 합산 소득 게이지바 (총길이 2,500만, 1,000만=40%, 2,000만=80% 정확한 비례 배치 및 틱 정렬)
 * 3. 하단 듀얼 버튼:
 *    - [좌측] 🟢 "등록가능" (부합 시 녹색) / 🔴 "탈락" (미부합 시 빨간색) 상태 버튼
 *    - [우측] 💰 "지역가입자 예상보험료" 이동 버튼
 */

import { appState } from '../state.js?v=20260921_01';
import { formatKoreanMoney, formatNumber } from '../rules/healthData2026.js?v=20260921_01';

export class QualificationGauge {
  constructor(gaugeContainerId, criteriaContainerId, onNavigateToMenu2, onSave, onReset) {
    this.gaugeContainerId = gaugeContainerId;
    this.criteriaContainerId = criteriaContainerId;
    this.onNavigateToMenu2 = onNavigateToMenu2;
    this.onSave = onSave;
    this.onReset = onReset;
  }

  render({ totalIncome = 0, propertyTaxBase = 0, hasBusinessReg = false, businessIncome = 0 }) {
    const criteriaContainer = document.getElementById(this.criteriaContainerId);
    const gaugeContainer = document.getElementById(this.gaugeContainerId);

    // 1. 재산 구간 판정
    const isTier1 = propertyTaxBase <= 540000000;
    const isTier2 = propertyTaxBase > 540000000 && propertyTaxBase <= 900000000;
    const isTier3 = propertyTaxBase > 900000000; // 9억 초과

    // 재산에 연동되는 소득 한도선
    let incomeLimit = 20000000; // 5.4억 이하 -> 2,000만원
    let activeCard = 1;

    if (isTier2) {
      incomeLimit = 10000000;  // 5.4억 초과 ~ 9억 이하 -> 1,000만원
      activeCard = 2;
    } else if (isTier3) {
      incomeLimit = 0;         // 9억 초과 -> 탈락
      activeCard = 3;
    }

    // 2. 재산 게이지바 계산 (총길이 10억 원 기준, 9억=90%, 5.4억=54%)
    const propMaxScale = 1000000000; // 10억
    const propPercent = Math.min(100, Math.max(0, (propertyTaxBase / propMaxScale) * 100));
    const propLimit = isTier1 ? 540000000 : 900000000; // 기준 1: 5.4억, 기준 2/3: 9억
    const propLimitPercent = (propLimit / propMaxScale) * 100; // 5.4억 ➔ 54%, 9.0억 ➔ 90%
    const propLimitLabel = isTier1 ? '5.4억 (기준한도)' : '9억 (최종한도)';
    const isPropertyPass = propertyTaxBase <= 900000000;

    // 3. 소득 게이지바 계산 (총길이 2,500만 원 기준, 1,000만=40%, 2,000만=80%)
    const incomeMaxScale = 25000000; // 2,500만원
    const incomePercent = Math.min(100, Math.max(0, (totalIncome / incomeMaxScale) * 100));
    const incomeLimitPercent = (incomeLimit / incomeMaxScale) * 100; // 1,000만 ➔ 40%, 2,000만 ➔ 80%
    const isIncomePass = !isTier3 && (totalIncome <= incomeLimit);

    // 4. 사업소득 판정
    let isBusinessPass = true;
    let businessMessage = '';
    if (hasBusinessReg && businessIncome > 0) {
      isBusinessPass = false;
      businessMessage = '사업자등록 있음: 소득 1원 발생으로 미부합';
    } else if (!hasBusinessReg && businessIncome > 5000000) {
      isBusinessPass = false;
      businessMessage = '사업자등록 없음: 소득 500만원 초과로 미부합';
    }

    // 최종 피부양자 등록 가능 여부
    const isOverallPass = isPropertyPass && isIncomePass && isBusinessPass;

    // 5. 상단 기준표 3단 카드 렌더링 (Santorini Breeze 3열 그리드)
    if (criteriaContainer) {
      criteriaContainer.innerHTML = `
        <div class="criteria-header-tabs criteria-tabs-3col">
          <!-- 기준 1 -->
          <div class="criteria-tab-card ${activeCard === 1 ? 'active-tier' : ''}">
            <div class="tab-badge">기준 ①</div>
            <div class="tab-title">과표 5.4억 이하</div>
            <div class="tab-sub">연소득 <strong class="text-highlight">2,000만원 이하</strong></div>
            ${activeCard === 1 ? '<span class="active-indicator">적용 중</span>' : ''}
          </div>
          
          <!-- 기준 2 -->
          <div class="criteria-tab-card ${activeCard === 2 ? 'active-tier' : ''}">
            <div class="tab-badge">기준 ②</div>
            <div class="tab-title">과표 5.4억~9억</div>
            <div class="tab-sub">연소득 <strong class="text-highlight">1,000만원 이하</strong></div>
            ${activeCard === 2 ? '<span class="active-indicator">적용 중</span>' : ''}
          </div>

          <!-- 기준 3 [개편]: 사업자등록 등록/비등록 뱃지 -->
          <div class="criteria-tab-card ${hasBusinessReg ? 'active-tier' : ''}">
            <div class="tab-badge">기준 ③</div>
            <div class="tab-title">사업자등록</div>
            <div class="criteria-bus-badge-row">
              <button type="button" class="btn-bus-badge ${!hasBusinessReg ? 'active' : ''}" id="btnCriteriaBusNo">
                비등록
              </button>
              <button type="button" class="btn-bus-badge ${hasBusinessReg ? 'active danger' : ''}" id="btnCriteriaBusYes">
                등록
              </button>
            </div>
            <div class="criteria-bus-sub-note">
              ${hasBusinessReg ? '소득 1원 시 탈락' : '500만 원 이하'}
            </div>
          </div>
        </div>

        ${activeCard === 3 ? `
          <div class="alert-banner alert-danger mt-2 mb-1">
            <span class="alert-icon">⚠️</span>
            <div class="alert-text">
              <strong>재산 과표 9억 원 초과:</strong> 소득과 관계없이 피부양자 대상에서 제외(탈락)됩니다.
            </div>
          </div>
        ` : ''}
      `;

      // 기준 3 토글 버튼 이벤트
      const btnBusNo = document.getElementById('btnCriteriaBusNo');
      const btnBusYes = document.getElementById('btnCriteriaBusYes');
      if (btnBusNo && btnBusYes) {
        btnBusNo.addEventListener('click', () => {
          appState.updatePrimaryUser('hasBusinessReg', false);
          appState.saveToStorage();
        });
        btnBusYes.addEventListener('click', () => {
          appState.updatePrimaryUser('hasBusinessReg', true);
          appState.saveToStorage();
        });
      }
    }


    // 6. 최종결과 섹션 (게이지바 & 듀얼 버튼) 렌더링
    if (gaugeContainer) {
      gaugeContainer.innerHTML = `
        <!-- 최종결과 제목 및 우측 저장/초기화 기능 버튼 -->
        <div class="section-title-row mb-2">
          <h3 class="section-title">
            <span class="section-title-icon" style="display: inline-flex; align-items: center; color: var(--color-cobalt-coast, #0047AB);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="16" y1="14" x2="16" y2="18"></line>
                <path d="M16 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M8 14h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M8 18h.01"></path>
              </svg>
            </span>
            <span>최종결과</span>
          </h3>
          <div class="result-header-actions">
            <button type="button" class="btn-tool btn-save-tool" id="btnSaveResult" title="입력 정보 저장">
              <span class="btn-icon">💾</span> 저장
            </button>
            <button type="button" class="btn-tool btn-reset-tool" id="btnResetResult" title="입력 정보 초기화">
              <span class="btn-icon">🔄</span> 초기화
            </button>
          </div>
        </div>

        <div class="gauge-visual-container">
          <!-- 1. [상단] 재산세 과세표준 진행바 -->
          <div class="gauge-item">
            <div class="gauge-label-row">
              <span class="gauge-title">
                <i class="icon">🏠</i> 재산세 과세표준
              </span>
            </div>

            <div class="progress-track-wrapper">
              <div class="progress-track">
                <!-- 채워지는 재산 게이지 바 -->
                <div class="progress-fill ${isPropertyPass ? 'fill-blue' : 'fill-rose'}" 
                     style="width: ${propPercent}%;">
                  <span class="fill-current-text">${propertyTaxBase > 0 ? formatKoreanMoney(propertyTaxBase) : ''}</span>
                </div>

                <!-- 기준 1/2 연동 재산 한도 점선 마커 (기준 1: 5.4억, 기준 2/3: 9억) -->
                <div class="threshold-marker-line marker-danger" style="left: ${propLimitPercent}%;">
                  <div class="marker-dot"></div>
                  <div class="marker-label">${propLimitLabel}</div>
                </div>
              </div>

              <!-- 수학적 비율로 정확히 정렬된 틱 라벨 (0원=0%, 5.4억=54%, 9.0억=90%, 10억=100%) -->
              <div class="progress-ticks-proportional">
                <span class="tick-label" style="left: 0%;">0원</span>
                <span class="tick-label tick-center ${isTier1 ? 'font-bold text-danger' : ''}" style="left: 54%;">5.4억</span>
                <span class="tick-label tick-center ${!isTier1 ? 'font-bold text-danger' : ''}" style="left: 90%;">9.0억</span>
                <span class="tick-label tick-end" style="left: 100%;">10억</span>
              </div>
            </div>
          </div>

          <!-- 2. [하단] 연소득 진행바 -->
          <div class="gauge-item mt-4">
            <div class="gauge-label-row">
              <span class="gauge-title">
                <i class="icon">💵</i> 연소득
              </span>
            </div>

            <div class="progress-track-wrapper">
              <div class="progress-track">
                <!-- 채워지는 소득 게이지 바 -->
                <div class="progress-fill ${isIncomePass ? 'fill-green' : 'fill-rose'}" 
                     style="width: ${incomePercent}%;">
                  <span class="fill-current-text">${totalIncome > 0 ? formatNumber(totalIncome) + '원' : ''}</span>
                </div>
                
                <!-- 재산과표에 연동된 자격기준 점선 마커 (1,000만=40% 또는 2,000만=80%) -->
                ${incomeLimit > 0 ? `
                  <div class="threshold-marker-line" style="left: ${incomeLimitPercent}%;">
                    <div class="marker-dot"></div>
                    <div class="marker-label">기준선 ${formatKoreanMoney(incomeLimit)}</div>
                  </div>
                ` : ''}
              </div>

              <!-- 수학적 비율로 정확히 정렬된 틱 라벨 (0원=0%, 1,000만=40%, 2,000만=80%, 2,500만=100%) -->
              <div class="progress-ticks-proportional">
                <span class="tick-label" style="left: 0%;">0원</span>
                <span class="tick-label tick-center ${incomeLimit === 10000000 ? 'font-bold text-danger' : ''}" style="left: 40%;">1,000만</span>
                <span class="tick-label tick-center ${incomeLimit === 20000000 ? 'font-bold text-danger' : ''}" style="left: 80%;">2,000만</span>
                <span class="tick-label tick-end" style="left: 100%;">2,500만</span>
              </div>
            </div>
          </div>

          ${!isBusinessPass ? `
            <div class="gauge-item mt-3">
              <div class="gauge-label-row">
                <span class="gauge-title">
                  <i class="icon">💼</i> ${businessMessage}
                </span>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      // 우측 상단 저장 버튼 이벤트 연결
      const btnSave = document.getElementById('btnSaveResult');
      if (btnSave && this.onSave) {
        btnSave.addEventListener('click', () => {
          this.onSave();
        });
      }

      // 우측 상단 초기화 버튼 이벤트 연결
      const btnReset = document.getElementById('btnResetResult');
      if (btnReset && this.onReset) {
        btnReset.addEventListener('click', () => {
          this.onReset();
        });
      }
    }
  }
}
