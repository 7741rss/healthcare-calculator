/**
 * [메뉴 2] 지역가입자 보험료 산정 모듈 (menu2Local.js)
 * 
 * 1. 상단 설명 박스: 왼쪽 상단 [세대합산] 뱃지 + "세대원의 재산세과표 금액과 소득을 합산하여 건강보험료를 산정"
 * 2. 기준 1, 기준 2 박스:
 *    - 기준 1 [재산세 과표]: "기본공제 1억 원 차감 후 과세표준(1~60등급) 점수당 211.5원 곱하여 보험료 산출"
 *    - 기준 2 [세대원 총 소득액]: "총 소득금액에서 소득월액으로 환산하여 건강보험료률 적용하여 산출" + "1,000만원 미만 미부과"
 * 3. 예상 건강보험료 박스:
 *    - 중앙 상단 줄 중첩 뱃지: "예상 건강보험료"
 *    - 순수 금액 표시: "000,000원"
 *    - 기간 버튼: [월], [1년], [2년], [3년], [4년], [5년] (누르면 실시간 총계 산출)
 * 4. 3단계 법정 산출근거 상세 카드:
 *    - Step 1: 🏠 재산보험료 (과표합산 ➔ 1억 공제 ➔ 1~60등급 재산부과점수 ➔ 211.5원) + [📊 재산 등급표 보기 ➔] 모달
 *    - Step 2: 💵 소득보험료 (소득별 법정 반영률 ➔ 1,000만 미만 면제 ➔ 7.19% 정률제) + [📋 소득 부과기준 보기 ➔] 모달
 *    - Step 3: 🛡️ 장기요양보험료 (건보료의 13.90%) 및 최종 세대합산 월 납부액
 */

import { appState } from '../state.js?v=20260921_01';
import { 
  calculateLocalHealthFeeDetailed, 
  formatNumber 
} from '../rules/healthData2026.js?v=20260921_01';
import { PropertyScoreModal } from '../components/propertyScoreModal.js?v=20260921_01';
import { IncomeCriteriaModal } from '../components/incomeCriteriaModal.js?v=20260921_01';

export class Menu2LocalModule {
  constructor(containerId, onNavigateToDiagnosis, onBackToInput) {
    this.container = document.getElementById(containerId);
    this.onNavigateToDiagnosis = onNavigateToDiagnosis;
    this.onBackToInput = onBackToInput;

    this.selectedPeriod = 1; // 1: 월, 12: 1년, 24: 2년, 36: 3년, 48: 4년, 60: 5년
    this.propModal = new PropertyScoreModal('menu2PropertyModalContainer');
    this.incomeModal = new IncomeCriteriaModal('menu2IncomeCriteriaModalContainer');
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    // Master DB 엔진을 통한 세대합산 지역보험료 일원화 산출
    const localCalc = calculateLocalHealthFeeDetailed(appState);

    const rawProp = localCalc.rawPropertyTaxBase;
    const netProp = localCalc.netPropertyTaxBase;
    const propPoints = localCalc.propertyPoints;
    const propGrade = localCalc.propertyGrade;
    const propFee = localCalc.propertyFee;

    const grossIncome = localCalc.grossAnnualIncome;
    const appliedIncome = localCalc.appliedAnnualIncome;
    const monthlyIncome = localCalc.monthlyAppliedIncome;
    const isExempt = localCalc.isIncomeExempt;
    const incomeFee = localCalc.incomeFee;

    const householdIncome = appState.getHouseholdIncomeByCategory(true);
    const laborApplied = Math.round(householdIncome.laborIncome * 0.5);
    const pensionApplied = Math.round(householdIncome.pensionIncome * 0.5);

    const pureHealthFee = localCalc.pureHealthFee;
    const ltcFee = localCalc.longTermCareFee;
    const monthlyTotalFee = localCalc.monthlyTotalFee;

    this.container.innerHTML = `
      <div class="menu-view-card">
        <!-- 1. 최상단 박스형 설명 배너 (왼쪽 상단 [세대합산] 뱃지 중첩) -->
        <div class="top-title-banner top-title-banner-nested">
          <span class="banner-nested-badge">세대합산</span>
          <span class="banner-icon">👥</span>
          <span class="banner-text">세대원의 재산세과표 금액과 소득을 합산하여 건강보험료를 산정</span>
        </div>

        <!-- 2. 기준 1, 기준 2 박스 -->
        <div class="menu2-criteria-grid mt-3">
          <div class="menu2-criteria-card">
            <div class="menu2-criteria-header">
              <span class="menu2-criteria-badge badge-crit-1">기준 1</span>
              <span class="menu2-criteria-title">재산세 과표</span>
            </div>
            <p class="menu2-criteria-desc">기본공제 1억 원 차감 후 과세표준(1~60등급) 점수당 211.5원 곱하여 보험료 산출</p>
          </div>

          <div class="menu2-criteria-card">
            <div class="menu2-criteria-header">
              <span class="menu2-criteria-badge badge-crit-2">기준 2</span>
              <span class="menu2-criteria-title">세대원 총 소득액</span>
            </div>
            <p class="menu2-criteria-desc">총 소득금액에서 소득월액으로 환산하여 건강보험료률 적용하여 산출</p>
            <p class="menu2-criteria-sub-desc">1,000만원 미만 미부과</p>
          </div>
        </div>

        <!-- 3. 예상 건강보험료 박스 (중앙 상단 줄 중첩 뱃지 + 순수 금액 표시 + 기간 인터랙티브 버튼) -->
        <div class="menu2-expected-fee-card mt-3">
          <span class="expected-fee-center-badge">예상 건강보험료</span>

          <div class="expected-fee-amount-display" id="menu2ExpectedAmount">
            ${formatNumber(monthlyTotalFee)}원
          </div>

          <!-- 기간 선택 버튼 그리드 (월, 1년, 2년, 3년, 4년, 5년) -->
          <div class="period-btn-group mt-3" role="group" aria-label="보험료 납부 기간 선택">
            <button type="button" class="period-btn ${this.selectedPeriod === 1 ? 'active' : ''}" data-period="1" data-label="월">월</button>
            <button type="button" class="period-btn ${this.selectedPeriod === 12 ? 'active' : ''}" data-period="12" data-label="1년">1년</button>
            <button type="button" class="period-btn ${this.selectedPeriod === 24 ? 'active' : ''}" data-period="24" data-label="2년">2년</button>
            <button type="button" class="period-btn ${this.selectedPeriod === 36 ? 'active' : ''}" data-period="36" data-label="3년">3년</button>
            <button type="button" class="period-btn ${this.selectedPeriod === 48 ? 'active' : ''}" data-period="48" data-label="4년">4년</button>
            <button type="button" class="period-btn ${this.selectedPeriod === 60 ? 'active' : ''}" data-period="60" data-label="5년">5년</button>
          </div>
        </div>

        <!-- 4. 3단계 법정 산출근거 상세 카드 그리드 (Step 1, 2, 3) -->
        <div class="detail-steps-container mt-3">
          <!-- Step 1: 재산보험료 상세 -->
          <div class="detail-step-card">
            <div class="detail-step-top">
              <div class="detail-step-identity">
                <span class="detail-step-badge badge-step-prop">Step 1</span>
                <h4 class="detail-step-name">🏠 재산보험료 산출</h4>
              </div>
              <button type="button" class="btn-step-modal" id="btnOpenPropertyScoreModal">
                <span>📊 재산 등급표 보기 ➔</span>
              </button>
            </div>

            <div class="detail-step-body">
              <div class="calc-key-val-list">
                <div class="calc-kv-row">
                  <span class="calc-k-label">세대 총 과세표준 합산</span>
                  <span class="calc-v-val">${formatNumber(rawProp)}원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">법정 기본공제(1억원)</span>
                  <span class="calc-v-val text-deduct">- 100,000,000원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">공제 후 과세표준</span>
                  <span class="calc-v-val font-bold">${formatNumber(netProp)}원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">재산부과점수</span>
                  <span class="calc-v-val">
                    <span class="badge-points-highlight">${propPoints}점</span><span class="grade-sub-text"> (${propGrade > 0 ? propGrade + '등급' : '면제'})</span>
                  </span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">재산점수당 단가</span>
                  <span class="calc-v-val">× 211.5원</span>
                </div>
              </div>

              <div class="calc-summary-result-box box-prop-result">
                <span class="calc-result-sub-label">재산보험료 산정액</span>
                <span class="calc-result-sub-calc">${propPoints}점 × 211.5원 = <strong>${formatNumber(propFee)}원</strong></span>
              </div>
            </div>
          </div>

          <!-- Step 2: 소득보험료 상세 -->
          <div class="detail-step-card mt-3">
            <div class="detail-step-top">
              <div class="detail-step-identity">
                <span class="detail-step-badge badge-step-income">Step 2</span>
                <h4 class="detail-step-name">💵 소득보험료 산출</h4>
              </div>
              <button type="button" class="btn-step-modal" id="btnOpenIncomeCriteriaModal">
                <span>📋 소득 부과기준 보기 ➔</span>
              </button>
            </div>

            <div class="detail-step-body">
              <div class="calc-key-val-list">
                <div class="calc-kv-row">
                  <span class="calc-k-label">세대 총 연간소득 합산</span>
                  <span class="calc-v-val font-bold">${formatNumber(appliedIncome)}원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">(근로소득(50%))</span>
                  <span class="calc-v-val">${formatNumber(laborApplied)}원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">(연금소득(50%))</span>
                  <span class="calc-v-val">${formatNumber(pensionApplied)}원</span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">1,000만 원 미만 여부</span>
                  <span class="calc-v-val">
                    <span class="badge-income-exempt ${isExempt ? 'exempt' : 'apply'}">
                      ${isExempt ? '1,000만 원 미만 (합산 제외 · 0원)' : '1,000만 원 이상 (정률 7.19% 부과)'}
                    </span>
                  </span>
                </div>
                ${!isExempt ? `
                  <div class="calc-kv-row">
                    <span class="calc-k-label">소득월액</span>
                    <span class="calc-v-val">${formatNumber(appliedIncome)}원 ÷ 12개월 = ${formatNumber(monthlyIncome)}원</span>
                  </div>
                  <div class="calc-kv-row">
                    <span class="calc-k-label">소득 건강보험료율</span>
                    <span class="calc-v-val"><span class="badge-rate-highlight">7.19%</span></span>
                  </div>
                ` : ''}
              </div>

              <div class="calc-summary-result-box box-income-result">
                <span class="calc-result-sub-label">소득보험료 산정액</span>
                <span class="calc-result-sub-calc">
                  ${isExempt ? '1,000만원 미만 합산 제외 = <strong>0원</strong>' : `${formatNumber(monthlyIncome)}원 × 7.19% = <strong>${formatNumber(incomeFee)}원</strong>`}
                </span>
              </div>
            </div>
          </div>

          <!-- Step 3: 장기요양보험료 산출 -->
          <div class="detail-step-card mt-3">
            <div class="detail-step-top">
              <div class="detail-step-identity">
                <span class="detail-step-badge badge-step-ltc">Step 3</span>
                <h4 class="detail-step-name">🛡️ 장기요양보험료 산출</h4>
              </div>
            </div>

            <div class="detail-step-body">
              <div class="calc-key-val-list">
                <div class="calc-kv-row">
                  <span class="calc-k-label">건강보험료 합계 (재산 + 소득)</span>
                  <span class="calc-v-val">${formatNumber(propFee)}원 + ${formatNumber(incomeFee)}원 = <strong>${formatNumber(pureHealthFee)}원</strong></span>
                </div>
                <div class="calc-kv-row">
                  <span class="calc-k-label">장기요양보험료율 (법정 13.90%)</span>
                  <span class="calc-v-val font-bold">순수 건보료 × 0.9994% ÷ 7.19%</span>
                </div>
              </div>

              <div class="calc-summary-result-box box-ltc-result">
                <span class="calc-result-sub-label">장기요양보험료 산정액</span>
                <span class="calc-result-sub-calc">
                  ${formatNumber(pureHealthFee)}원 × 13.90% = <strong>${formatNumber(ltcFee)}원</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updatePeriodDisplay(monthlyTotalFee);
  }

  // 기간 버튼(월, 1년, 2년, 3년, 4년, 5년) 선택에 따른 순수 총액("000,000원") 실시간 업데이트
  updatePeriodDisplay(monthlyTotalFee) {
    const elAmount = document.getElementById('menu2ExpectedAmount');
    if (!elAmount) return;

    const period = this.selectedPeriod;
    const totalAmount = monthlyTotalFee * period;

    elAmount.textContent = `${formatNumber(totalAmount)}원`;
  }

  bindEvents() {
    // 재산 부과점수표 모달 열기
    const btnPropModal = document.getElementById('btnOpenPropertyScoreModal');
    if (btnPropModal) {
      btnPropModal.addEventListener('click', () => {
        const localCalc = calculateLocalHealthFeeDetailed(appState);
        this.propModal.open(
          localCalc.propertyGrade,
          localCalc.netPropertyTaxBase,
          localCalc.rawPropertyTaxBase
        );
      });
    }

    // 소득 부과기준 모달 열기
    const btnIncomeModal = document.getElementById('btnOpenIncomeCriteriaModal');
    if (btnIncomeModal) {
      btnIncomeModal.addEventListener('click', () => {
        const localCalc = calculateLocalHealthFeeDetailed(appState);
        this.incomeModal.open(
          localCalc.appliedAnnualIncome,
          localCalc.grossAnnualIncome
        );
      });
    }

    // 기간 버튼 클릭 이벤트 바인딩
    const periodButtons = this.container.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = parseInt(btn.dataset.period, 10) || 1;
        this.selectedPeriod = period;

        periodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const localCalc = calculateLocalHealthFeeDetailed(appState);
        this.updatePeriodDisplay(localCalc.monthlyTotalFee);
      });
    });
  }
}
