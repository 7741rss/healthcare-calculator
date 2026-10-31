/**
 * [랜딩 페이지] 모듈 (menu0Landing.js)
 * 
 * - Santorini Breeze 테마 적용
 * - "퇴직후 건보료 폭탄을 미리 준비하세요"
 * - "재산과 소득금액 한번 입력으로 최적의 선택을 알려줍니다"
 * - 순차 페이드인 애니메이션 후 공통입력 페이지로 부드럽게 자동 전환 (화면 탭 시 즉시 전환)
 */

export class Menu0LandingModule {
  constructor(containerId, onStart) {
    this.container = document.getElementById(containerId);
    this.onStart = onStart;
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="landing-splash-container" id="landingSplashWrap">
        <h2 class="splash-main-title">
          퇴직후 건보료 폭탄을<br/>
          <span class="splash-title-row">미리 준비하세요 <span class="landing-revision-badge">2027년 개정판</span></span>
        </h2>
        
        <p class="splash-sub-title">
          재산과 소득금액 한번 입력으로<br/>
          최적의 선택을 알려줍니다
        </p>
        
        <div class="splash-indicator-wrap">
          <div class="splash-pulse-dot"></div>
          <span class="splash-guide-hint">화면을 터치하면 시작합니다</span>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const wrap = document.getElementById('landingSplashWrap');
    if (wrap) {
      wrap.addEventListener('click', () => {
        if (this.onStart) this.onStart();
      });
    }
  }

  destroy() {}
}
