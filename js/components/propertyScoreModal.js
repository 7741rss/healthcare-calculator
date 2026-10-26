/**
 * 2026년도 지역가입자 재산 부과점수표(국민건강보험법 시행령 제42조제1항 [별표 4] 1~60등급) 조회 모달 컴포넌트
 * (propertyScoreModal.js)
 */

import { HEALTH_RULES_2026, formatKoreanMoney, formatNumber } from '../rules/healthData2026.js?v=20260921_01';

export class PropertyScoreModal {
  constructor(modalContainerId = 'propertyModalContainer') {
    this.modalContainerId = modalContainerId;
    this.currentGrade = null;
    this.netPropertyTaxBase = 0;
    this.rawPropertyTaxBase = 0;
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  getContainer() {
    return document.getElementById(this.modalContainerId);
  }

  open(currentGrade = null, netPropertyTaxBase = 0, rawPropertyTaxBase = 0) {
    this.currentGrade = currentGrade;
    this.netPropertyTaxBase = netPropertyTaxBase;
    this.rawPropertyTaxBase = rawPropertyTaxBase;

    const container = this.getContainer();
    if (!container) return;

    this.render();
    container.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 모달 바디 스크롤을 맨 위로 초기화
    const modalBody = container.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }

    // ESC 키 리스너 등록
    document.addEventListener('keydown', this._handleKeydown);

    // 활성화된 등급 행으로 안전하게 자동 스크롤 (전역 윈도우 스크롤 왜곡 방지)
    if (currentGrade && currentGrade > 0 && netPropertyTaxBase > 0) {
      setTimeout(() => {
        const activeRow = document.getElementById(`tier-row-${currentGrade}`);
        if (activeRow && modalBody) {
          const rowTop = activeRow.offsetTop;
          modalBody.scrollTo({ top: Math.max(0, rowTop - 120), behavior: 'smooth' });
        }
      }, 100);
    }
  }

  close() {
    const container = this.getContainer();
    if (container) {
      container.innerHTML = '';
      container.classList.remove('active');
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._handleKeydown);
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      this.close();
    }
  }

  render() {
    const container = this.getContainer();
    if (!container) return;

    const currentGrade = this.currentGrade;
    const netPropertyTaxBase = this.netPropertyTaxBase;
    const rawPropertyTaxBase = this.rawPropertyTaxBase;

    // 현재 매칭 요약 안내 텍스트 (아이콘 제거 및 가시성 극대화)
    let currentMatchHtml = '';
    if (rawPropertyTaxBase > 0) {
      if (netPropertyTaxBase <= 0) {
        currentMatchHtml = `
          <div class="modal-current-match-banner property-match-banner match-zero">
            <div class="match-row">
              <span class="match-label">과세표준:</span>
              <span class="match-val"><strong>${formatNumber(rawPropertyTaxBase)}원</strong> <span class="match-sub">(${formatKoreanMoney(rawPropertyTaxBase)})</span></span>
            </div>
            <div class="match-row">
              <span class="match-label">적용결과:</span>
              <span class="match-val"><strong>1억 원 기본공제로 전액 감면</strong> <span class="match-fee">(0점 · 0원)</span></span>
            </div>
          </div>
        `;
      } else {
        const activeTier = HEALTH_RULES_2026.PROPERTY_TIER_TABLE.find(t => t.grade === currentGrade);
        const activePoints = activeTier ? activeTier.points : 0;
        const activeFee = Math.round(activePoints * HEALTH_RULES_2026.POINT_UNIT_PRICE);
        currentMatchHtml = `
          <div class="modal-current-match-banner property-match-banner match-active">
            <div class="match-row">
              <span class="match-label">과세표준:</span>
              <span class="match-val"><strong>${formatNumber(rawPropertyTaxBase)}원</strong> <span class="match-sub">(1억 공제 후 ${formatNumber(netPropertyTaxBase)}원)</span></span>
            </div>
            <div class="match-row">
              <span class="match-label">적용등급:</span>
              <span class="match-val"><strong>${currentGrade}등급 · ${activePoints.toLocaleString()}점</strong> <span class="match-fee">(월 ${formatNumber(activeFee)}원)</span></span>
            </div>
          </div>
        `;
      }
    } else {
      currentMatchHtml = `
        <div class="modal-current-match-banner property-match-banner match-none">
          <div class="match-row">
            <span class="match-label">안내:</span>
            <span class="match-val">재산세 과세표준에서 <strong>1억 원 기본공제</strong> 후 등급별 점수(211.5원)가 적용됩니다.</span>
          </div>
        </div>
      `;
    }

    // 간결한 과표 단위 포맷 함수 (줄바꿈 방지)
    const formatTierMoney = (val) => {
      if (val === 0) return '0원';
      if (val === Infinity) return '초과';
      const eok = Math.floor(val / 100000000);
      const man = Math.round((val % 100000000) / 10000);
      let res = '';
      if (eok > 0) res += `${eok}억 `;
      if (man > 0) res += `${man.toLocaleString()}만`;
      return res.trim();
    };

    const tableRows = HEALTH_RULES_2026.PROPERTY_TIER_TABLE.map(tier => {
      const minText = formatTierMoney(tier.min);
      const maxText = formatTierMoney(tier.max);
      const rangeStr = tier.grade === 1 
        ? `${maxText} 이하`
        : (tier.max === Infinity 
            ? `${minText} 초과`
            : `${minText} ~ ${maxText}`);
      const feeEst = Math.round(tier.points * HEALTH_RULES_2026.POINT_UNIT_PRICE);
      const isActive = currentGrade === tier.grade && netPropertyTaxBase > 0;

      return `
        <tr class="${isActive ? 'active-tier-row' : ''}" id="tier-row-${tier.grade}">
          <td class="text-center font-bold tier-col-grade">
            <span class="tier-grade-number">${tier.grade}등급</span>
            ${isActive ? '<span class="active-tier-tag">⭐ 내 등급</span>' : ''}
          </td>
          <td class="font-semibold text-slate-800 tier-col-range">${rangeStr}</td>
          <td class="text-right tier-col-score">
            <div class="tier-points-text">${tier.points.toLocaleString()}점</div>
            <div class="tier-fee-text ${isActive ? 'text-emerald' : 'text-blue'}">월 ${formatNumber(feeEst)}원</div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="modal-backdrop" id="propertyModalBackdrop">
        <div class="modal-card modal-card-compact">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">📊</span>
              <div>
                <h3 class="modal-title">재산등급별 부과점수표 (1~60등급)</h3>
                <p class="modal-subtitle">기본공제 1억 원 차감 후 과세표준 기준 (점수당 211.5원)</p>
              </div>
            </div>
            <button type="button" class="modal-close-btn" id="closePropertyModalBtn" aria-label="닫기">&times;</button>
          </div>
          
          <div class="modal-body custom-scrollbar">
            ${currentMatchHtml}

            <div class="modal-info-box-compact">
              <div class="formula-tip"><strong>산식:</strong> (과표 - 1억 공제) 등급별 점수 × 211.5원</div>
              <div class="car-exempt-tip">※ 자동차 부과 전면 폐지 (0원)</div>
            </div>

            <div class="table-responsive mt-2">
              <table class="data-table data-table-compact data-table-compressed">
                <thead>
                  <tr>
                    <th style="width: 22%; text-align: center;">등급</th>
                    <th style="width: 44%;">공제 후 과세표준</th>
                    <th style="width: 34%; text-align: right;">부과점수 / 월 보험료</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-primary w-full font-bold" id="confirmPropertyModalBtn">확인 완료</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backdrop = document.getElementById('propertyModalBackdrop');
    const closeBtn = document.getElementById('closePropertyModalBtn');
    const confirmBtn = document.getElementById('confirmPropertyModalBtn');

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
