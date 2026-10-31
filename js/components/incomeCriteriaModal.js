/**
 * 2026년도 국민건강보험공단 공식 고시 기준 소득 부과 산출기준 안내 모달
 * 1) 연간 소득 1,000만 원 미만: 소득 합산 제외 (보험료 0원)
 * 2) 연간 소득 1,000만 원 이상: 소득월액(연소득 ÷ 12) × 건강보험료율(7.19%)
 * 3) 소득 반영률: 근로·공적연금 50% (50% 공제), 사업·이자·배당·기타 100% 반영
 */

import { HEALTH_RULES_2026, calculateIncomeHealthFee, formatKoreanMoney, formatNumber } from '../rules/healthData2026.js?v=20260921_01';

export class IncomeCriteriaModal {
  constructor(modalContainerId = 'incomeCriteriaModalContainer') {
    this.modalContainerId = modalContainerId;
  }

  getContainer() {
    return document.getElementById(this.modalContainerId);
  }

  render(appliedAnnualIncome = 0, grossAnnualIncome = 0) {
    const container = this.getContainer();
    if (!container) return;

    const incomeCalc = calculateIncomeHealthFee(appliedAnnualIncome);
    const monthlyIncomeHealthFee = incomeCalc.monthlyFee;

    container.innerHTML = `
      <div class="modal-backdrop" id="incomeCriteriaModalBackdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">📋</span>
              <div>
                <h3 class="modal-title">2026년도 소득 부과기준 및 산출 방식</h3>
                <p class="modal-subtitle">보건복지부 및 국민건강보험공단 공식 고시 기준</p>
              </div>
            </div>
            <button class="modal-close-btn" id="closeIncomeCriteriaModalBtn" aria-label="닫기">&times;</button>
          </div>
          
          <div class="modal-body custom-scrollbar">
            <!-- 1. 현재 세대 소득 매칭 실시간 요약 배너 (아이콘 제거 및 가시성 극대화) -->
            <div class="modal-current-match-banner property-match-banner match-active">
              <div class="match-row">
                <span class="match-label">세대 총소득:</span>
                <span class="match-val"><strong>${formatNumber(grossAnnualIncome)}원</strong> <span class="match-sub">(산정 반영소득 ${formatNumber(appliedAnnualIncome)}원)</span></span>
              </div>
              <div class="match-row">
                <span class="match-label">적용결과:</span>
                <span class="match-val">
                  ${incomeCalc.isExcluded 
                    ? `<strong>1,000만 원 미만 소득합산 제외</strong> <span class="match-fee">(소득 보험료 0원)</span>` 
                    : `<strong>소득정률제(7.19%) 적용</strong> <span class="match-fee">(월 ${formatNumber(monthlyIncomeHealthFee)}원)</span>`}
                </span>
              </div>
            </div>

            <!-- 2. 핵심 지표 4대 요약 카드 -->
            <div class="criteria-metric-grid mt-3">
              <div class="metric-card">
                <div class="metric-label">건강보험료율 (소득정률)</div>
                <div class="metric-value text-blue">7.19%</div>
                <div class="metric-sub">소득월액 × 7.19%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">소득합산 제외 기준</div>
                <div class="metric-value text-emerald">1,000만 원</div>
                <div class="metric-sub">연 1,000만원 미만 0원</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">장기요양보험료율</div>
                <div class="metric-value text-purple">0.9994%</div>
                <div class="metric-sub">건보료 대비 13.90%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">최저 건강보험료</div>
                <div class="metric-value text-slate">19,780원</div>
                <div class="metric-sub">월 하한 기준액</div>
              </div>
            </div>

            <!-- 3. 소득 종류별 반영률 테이블 (상단 배치로 실용성 극대화) -->
            <div class="income-ratio-table-wrap mt-3">
              <h4 class="table-section-title">2026년도 소득 종류별 건강보험료 반영률</h4>
              <div class="table-container custom-scrollbar">
                <table class="data-table data-table-compact mt-1">
                  <thead>
                    <tr>
                      <th style="width: 28%;">소득 구분</th>
                      <th style="width: 24%; text-align: center;">반영률</th>
                      <th style="width: 48%;">공단 산정 기준 및 공제 설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-bold">근로소득</td>
                      <td class="text-center font-bold text-blue">50% 반영</td>
                      <td>총 급여의 <strong>50% 공제</strong> (50%만 소득 반영)</td>
                    </tr>
                    <tr>
                      <td class="font-bold">공적연금</td>
                      <td class="text-center font-bold text-blue">50% 반영</td>
                      <td>국민·공무원·사학·군인연금 수령액의 <strong>50% 공제</strong></td>
                    </tr>
                    <tr>
                      <td class="font-bold">사업(임대)</td>
                      <td class="text-center font-bold text-slate-800">100% 반영</td>
                      <td>총수입에서 필요경비 차감 후 국세청 신고 소득금액</td>
                    </tr>
                    <tr>
                      <td class="font-bold">이자소득</td>
                      <td class="text-center font-bold text-slate-800">100% 반영</td>
                      <td>예·적금 등 금융 이자소득 전액</td>
                    </tr>
                    <tr>
                      <td class="font-bold">배당소득</td>
                      <td class="text-center font-bold text-slate-800">100% 반영</td>
                      <td>국내외 주식 배당 및 펀드 분배금 전액</td>
                    </tr>
                    <tr>
                      <td class="font-bold">기타소득</td>
                      <td class="text-center font-bold text-slate-800">100% 반영</td>
                      <td>원고료, 강사료, 자문료 등 필요경비 차감 후 금액</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. 법정 소득 보험료 산정 기준 및 공식 상세 안내 -->
            <div class="law-formula-section mt-3">
              <h4 class="table-section-title">소득 보험료 2단계 산정 기준</h4>
              
              <!-- 구간 1: 1,000만 원 미만 -->
              <div class="law-tier-box ${incomeCalc.isExcluded ? 'active' : ''} mt-2">
                <div class="law-tier-header">
                  <span class="law-tier-badge ${incomeCalc.isExcluded ? 'badge-blue' : ''}">구간 ①</span>
                  <span class="law-tier-title">연소득 1,000만 원 미만 (소득합산 제외)</span>
                </div>
                <div class="law-tier-body">
                  <p class="font-semibold text-slate-800">• <strong>부과 기준:</strong> <span class="text-emerald font-bold">소득합산 전액 제외 (소득 보험료 0원)</span></p>
                  <p class="text-slate-600 mt-1">• <strong>산정 설명:</strong> 세대원 합산 연소득 1,000만 원 미만 시 소득 보험료 전액 면제</p>
                </div>
              </div>

              <!-- 구간 2: 1,000만 원 이상 -->
              <div class="law-tier-box ${!incomeCalc.isExcluded ? 'active' : ''} mt-2">
                <div class="law-tier-header">
                  <span class="law-tier-badge ${!incomeCalc.isExcluded ? 'badge-blue' : ''}">구간 ②</span>
                  <span class="law-tier-title">연소득 1,000만 원 이상 (소득정률제)</span>
                </div>
                <div class="law-tier-body">
                  <div class="formula-math-display">
                    <div class="math-main">
                      월 소득 건보료 = <span class="math-fraction"><span class="math-num">(연간 산정 반영소득)</span><span class="math-den">12개월</span></span> × <strong>7.19%</strong>
                    </div>
                  </div>
                  <p class="text-slate-600 mt-1">• <strong>산정 설명:</strong> 소득월액(연소득 ÷ 12)에 건강보험료율 7.19%를 곱하여 산출</p>
                </div>
              </div>
            </div>

            <!-- 5. 최근 5년 부과점수당 금액 및 보험료율 -->
            <div class="rate-history-section mt-3">
              <h4 class="table-section-title">최근 5년 보험료율 및 점수당 단가 추이</h4>
              <div class="table-container custom-scrollbar">
                <table class="data-table rate-history-table mt-1">
                  <thead>
                    <tr>
                      <th style="width: 18%; text-align: center;">연도</th>
                      <th style="width: 26%; text-align: center;">재산점수당 단가</th>
                      <th style="width: 28%; text-align: center;">건강보험료율</th>
                      <th style="width: 28%; text-align: center;">장기요양료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="active-current-year-row">
                      <td class="text-center font-bold text-primary">
                        2027
                        <span class="badge-current-tag">개정 확정</span>
                      </td>
                      <td class="text-center font-bold text-slate-800">211.5원</td>
                      <td class="text-center font-bold text-blue">7.19%</td>
                      <td class="text-center font-bold text-purple">0.9994%</td>
                    </tr>
                    <tr>
                      <td class="text-center font-bold">2026</td>
                      <td class="text-center text-slate-700">211.5원</td>
                      <td class="text-center text-slate-700">7.19%</td>
                      <td class="text-center text-slate-700">0.9448%</td>
                    </tr>
                    <tr>
                      <td class="text-center font-bold">2025</td>
                      <td class="text-center text-slate-700">208.4원</td>
                      <td class="text-center text-slate-700">7.09%</td>
                      <td class="text-center text-slate-700">0.9182%</td>
                    </tr>
                    <tr>
                      <td class="text-center font-bold">2024</td>
                      <td class="text-center text-slate-700">208.4원</td>
                      <td class="text-center text-slate-700">7.09%</td>
                      <td class="text-center text-slate-700">0.9182%</td>
                    </tr>
                    <tr>
                      <td class="text-center font-bold">2023</td>
                      <td class="text-center text-slate-700">208.4원</td>
                      <td class="text-center text-slate-700">7.09%</td>
                      <td class="text-center text-slate-700">0.9082%</td>
                    </tr>
                    <tr>
                      <td class="text-center font-bold">2022</td>
                      <td class="text-center text-slate-700">205.3원</td>
                      <td class="text-center text-slate-700">6.99%</td>
                      <td class="text-center text-slate-700">12.27%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 6. 출처 및 법적 근거 안내 -->
            <div class="modal-info-box mt-3">
              <p><strong>법적 근거 및 공식 출처:</strong></p>
              <ul style="margin: 4px 0 0 16px; font-size: 11.5px; line-height: 1.55; color: var(--slate-700);">
                <li><strong>법령</strong>: 「국민건강보험법 시행령」 제42조제1항 관련 [별표 4] 및 보건복지부 고시</li>
                <li><strong>확인</strong>: 국가법령정보센터 (law.go.kr) / 국민건강보험공단 홈페이지</li>
              </ul>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-primary w-full font-bold" id="confirmIncomeCriteriaModalBtn">확인 완료</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  open(appliedAnnualIncome = 0, grossAnnualIncome = 0) {
    const container = this.getContainer();
    if (!container) return;
    this.render(appliedAnnualIncome, grossAnnualIncome);
    container.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 모달 바디 스크롤을 맨 위로 초기화
    const modalBody = container.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }

    this._handleKeydown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.close();
      }
    };
    document.addEventListener('keydown', this._handleKeydown);
  }

  close() {
    const container = this.getContainer();
    if (container) {
      container.innerHTML = '';
      container.classList.remove('active');
    }
    document.body.style.overflow = '';
    if (this._handleKeydown) {
      document.removeEventListener('keydown', this._handleKeydown);
    }
  }

  bindEvents() {
    const backdrop = document.getElementById('incomeCriteriaModalBackdrop');
    const closeBtn = document.getElementById('closeIncomeCriteriaModalBtn');
    const confirmBtn = document.getElementById('confirmIncomeCriteriaModalBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.close();
        }
      });
    }
  }
}


