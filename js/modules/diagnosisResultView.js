/**
 * [Step 3] 3대 옵션 종합 진단 결과 모듈 (diagnosisResultView.js)
 * 
 * - 한 화면에 3대 옵션(피부양자 자격, 지역가입자, 임의계속가입)을 세로형 카드로 전면 배치
 * - 카드 1: [자격 충족] vs [자격 탈락] 여부만 강조 (금액 미표시)
 * - 카드 2: 세대합산 기준 월 예상 보험료 표시
 * - 카드 3: 직장 본인부담금 기준 월 예상 보험료 표시
 * - 각 카드 터치 시 해당 상세 페이지(메뉴 1, 2, 3)로 직행
 */

import { appState } from '../state.js?v=20260921_01';
import { evaluate3OptionsDiagnosis, formatNumber } from '../rules/healthData2026.js?v=20260921_01';

export class DiagnosisResultViewModule {
  constructor(containerId, onNavigateToDetail, onBackToCommonInput) {
    this.container = document.getElementById(containerId);
    this.onNavigateToDetail = onNavigateToDetail;
    this.onBackToCommonInput = onBackToCommonInput;
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    // Master DB 엔진을 통한 3대 옵션 일원화 산출
    const diagnosis = evaluate3OptionsDiagnosis(appState);
    const dep = diagnosis.dependent;
    const local = diagnosis.local;
    const vol = diagnosis.voluntary;

    const baseWorkFee = vol.baseFee;
    const totalWorkFee = vol.monthlyFee;
    const addResult = vol.addResult || {};
    const isExcess = addResult.isExcess;
    const excessAnnual = addResult.excessAnnual || 0;
    const monthlyExcess = addResult.monthlyExcess || 0;
    const addHealthFee = addResult.additionalHealthFee || 0;
    const addLtcFee = addResult.additionalLongTermFee || 0;
    const totalAdditional = vol.additionalFee;
    const linkedIncome = addResult.annualIncome || 0;

    const excessHtml = `
      <div class="detail-step-card mt-2">
        <div class="detail-step-top">
          <div class="detail-step-identity">
            <span class="detail-step-badge badge-step-income">세부산출근거</span>
          </div>
        </div>

        <div class="detail-step-body">
          <div class="calc-key-val-list">
            <div class="calc-kv-row calc-kv-highlight-income">
              <span class="calc-k-label">퇴직 전 직장 본인부담 건강보험료 (장기요양 포함)</span>
              <span class="calc-v-val">${formatNumber(baseWorkFee)}원</span>
            </div>
            <div class="calc-kv-row">
              <span class="calc-k-label">연간 산정 반영소득</span>
              <span class="calc-v-val">${formatNumber(linkedIncome)}원</span>
            </div>
            ${isExcess ? `
              <div class="calc-kv-row">
                <span class="calc-k-label">2,000만원 이상</span>
                <span class="calc-v-val text-deduct">-20,000,000원</span>
              </div>
              <div class="calc-kv-row">
                <span class="calc-k-label">소득월액</span>
                <span class="calc-v-val">${formatNumber(excessAnnual)}원 ÷ 12개월 = ${formatNumber(monthlyExcess)}원/월</span>
              </div>
              <div class="calc-kv-row">
                <span class="calc-k-label">추가 건강보험료</span>
                <span class="calc-v-val">${formatNumber(monthlyExcess)}원 × 7.19% = ${formatNumber(addHealthFee)}원/월</span>
              </div>
              <div class="calc-kv-row">
                <span class="calc-k-label">추가 장기요양료(13.90%)</span>
                <span class="calc-v-val">+${formatNumber(addLtcFee)}원/월</span>
              </div>
            ` : `
              <div class="calc-kv-row">
                <span class="calc-k-label">2,000만원 미만 여부</span>
                <span class="calc-v-val text-deduct">초과소득 없음(0원)</span>
              </div>
            `}
          </div>

          <div class="calc-summary-result-box box-income-result">
            <span class="calc-result-sub-label">최종 추가보험료</span>
            ${isExcess ? `
              <span class="calc-result-sub-calc">${formatNumber(addHealthFee)}원 + ${formatNumber(addLtcFee)}원 = <strong>+${formatNumber(totalAdditional)}원/월</strong></span>
            ` : `
              <span class="calc-result-sub-calc"><strong>0원/월</strong> (2,000만 원 이하 추가보험료 0원)</span>
            `}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = `
      <div class="diagnosis-container">
        <!-- 3대 옵션 세로 카드 그리드 -->
        <div class="diagnosis-vertical-cards">
          <!-- 1. 피부양자 자격 카드 -->
          <div class="diagnosis-card card-dependent" id="card_goto_menu1" role="button" tabindex="0" aria-label="피부양자 자격 상세 보기">
            <div class="diagnosis-card-header">
              <div class="card-title-wrap">
                <span class="card-icon card-icon-svg" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <polyline points="16 11 18 13 22 9"></polyline>
                  </svg>
                </span>
                <span class="card-title">피부양자 자격</span>
              </div>
            </div>

            <!-- 자격 충족 / 탈락 전면 강조 박스 -->
            <div class="dependent-status-box ${dep.isPass ? 'pass' : 'fail'}">
              <span class="status-badge-big ${dep.isPass ? 'pass' : 'fail'}">
                ${dep.isPass ? '자격충족' : '자격탈락'}
              </span>
              <span class="dependent-reason-text">
                ${dep.isPass ? '배우자/자녀 직장 등록 가능' : dep.failReasonText}
              </span>
            </div>

            <div class="card-touch-indicator">
              <span>상세 판정표 확인하기 ➔</span>
            </div>
          </div>

          <!-- 2. 지역가입자 카드 -->
          <div class="diagnosis-card card-local" id="card_goto_menu2" role="button" tabindex="0" aria-label="지역가입자 월 예상보험료 및 세부 산출내역">
            <div class="diagnosis-card-header">
              <div class="card-title-wrap">
                <span class="card-icon card-icon-svg" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
                <span class="card-title">지역가입자</span>
              </div>
            </div>

            <div class="card-fee-box">
              <span class="fee-label">월 예상 보험료</span>
              <span class="fee-value">월 ${formatNumber(local.monthlyFee)}원</span>
            </div>

            <div class="card-touch-indicator">
              <span>세대합산 산출내역 확인하기 ➔</span>
            </div>
          </div>

          <!-- 3. 임의계속가입 카드 (세부 산식, 초과보험료 박스 및 최하단 주요사항 포함) -->
          <div class="diagnosis-card card-voluntary" aria-label="임의계속가입 월 예상보험료 및 주요사항">
            <div class="diagnosis-card-header">
              <div class="card-title-wrap">
                <span class="card-icon">⚖️</span>
                <span class="card-title">임의계속가입</span>
              </div>
              <button type="button" class="btn-kp-toggle-badge" id="btnToggleVoluntaryKeyPoints" aria-expanded="false" aria-controls="voluntaryKeyPointsList">
                <span class="kp-badge-text">주요사항</span>
                <span class="kp-toggle-arrow">▾</span>
              </button>
            </div>

            <div class="card-fee-box">
              <span class="fee-label">월 예상 보험료</span>
              <span class="fee-value">
                월 ${formatNumber(totalWorkFee)}원
              </span>
            </div>

            <!-- [단일 박스 세부산출근거] 퇴직전 직장보험료 + 보수외 소득 2,000만원 초과분 산출 내역 -->
            ${excessHtml}

            <!-- [주요사항] 펼침 안내 목록 (상단 [주요사항 ▾] 버튼 클릭 시 토글) -->
            <div class="key-points-list key-points-collapse mt-3" id="voluntaryKeyPointsList" style="display: none;">
              <!-- 1행: 퇴직후 통지 -->
              <div class="key-point-item">
                <div class="kp-icon-box" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div class="kp-content">
                  <span class="kp-text">퇴직후 지역건보료 vs 임의가입 보험료 통지(건보공단)</span>
                </div>
              </div>

              <!-- 2행: 가입기간 -->
              <div class="key-point-item">
                <div class="kp-icon-box" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div class="kp-content">
                  <span class="kp-label">가입기간</span>
                  <span class="kp-arrow">➔</span>
                  <span class="kp-text">퇴직후 36개월(3년)</span>
                </div>
              </div>

              <!-- 3행: 신청기한 -->
              <div class="key-point-item">
                <div class="kp-icon-box" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div class="kp-content">
                  <span class="kp-label">신청기한</span>
                  <span class="kp-arrow">➔</span>
                  <span class="kp-text">지역건보료 고지서를 받은 날로부터 2개월 이내</span>
                </div>
              </div>

              <!-- 4행: 가입자 대상 내용 -->
              <div class="key-point-item">
                <div class="kp-icon-box" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div class="kp-content">
                  <span class="kp-text">직장가입자 당시 등재되어 있던 피부양자도 등록 유지</span>
                </div>
              </div>

              <!-- 5행: 가입여부 내용 -->
              <div class="key-point-item">
                <div class="kp-icon-box" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div class="kp-content">
                  <span class="kp-text">피부양자 자격후 다른 세대원 임의가입으로 재등록 가능</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 카드 1 (피부양자) 클릭 -> 피부양자 자격 상세 이동
    const card1 = document.getElementById('card_goto_menu1');
    if (card1) {
      card1.addEventListener('click', () => {
        if (this.onNavigateToDetail) {
          this.onNavigateToDetail('menu1');
        }
      });
    }

    // 카드 2 (지역가입자) 클릭 -> 지역가입자 보험료 산정 상세 이동
    const card2 = document.getElementById('card_goto_menu2');
    if (card2) {
      card2.addEventListener('click', () => {
        if (this.onNavigateToDetail) {
          this.onNavigateToDetail('menu2');
        }
      });
    }

    // 임의계속가입 주요사항 펼치기/접기 토글 버튼 이벤트
    const btnToggle = document.getElementById('btnToggleVoluntaryKeyPoints');
    const kpList = document.getElementById('voluntaryKeyPointsList');
    if (btnToggle && kpList) {
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // 부모 카드 클릭 이벤트 전파 방지
        const isHidden = kpList.style.display === 'none';
        if (isHidden) {
          kpList.style.display = 'flex';
          btnToggle.classList.add('active');
          btnToggle.setAttribute('aria-expanded', 'true');
          const arrow = btnToggle.querySelector('.kp-toggle-arrow');
          if (arrow) arrow.textContent = '▴';
        } else {
          kpList.style.display = 'none';
          btnToggle.classList.remove('active');
          btnToggle.setAttribute('aria-expanded', 'false');
          const arrow = btnToggle.querySelector('.kp-toggle-arrow');
          if (arrow) arrow.textContent = '▾';
        }
      });
    }
  }
}
