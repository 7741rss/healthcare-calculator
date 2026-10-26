/**
 * 건강보험료 계산기 메인 애플리케이션 진입점 (app.js)
 * 
 * 4대 핵심 화면 라우팅 및 실시간 상태 동기화 (Santorini Breeze 테마):
 * Screen 0: 랜딩 인트로 (landing) - 순차 페이드인 후 공통입력으로 전환
 * Screen 1: 공통 정보 입력 (commonInput) - 재산(단계 1)/소득(단계 2)/직장보험료(단계 3) 분할 입력, Check 안내, 실시간 요약 바
 * Screen 2: 3대 플랜 진단 결과 (diagnosisResult) - 피부양자/지역가입자/임의가입 세로형 카드 전면 배치 및 주요사항 안내
 * Screen 3: 피부양자 자격 확인 (menu1) - 기준 1,2,3(사업자등록 토글), 10억/2500만 게이지바, 상태 판정 및 주요사항
 * Screen 4: 임의계속가입 비교 (menu3) - (A안) [🔍 상세보기] 토글(직장보험료+추가보험료) vs (B안) 지역보험료 36개월 절감 분석
 */

import { appState } from './state.js?v=20260921_01';
import { Menu0LandingModule } from './modules/menu0Landing.js?v=20260921_01';
import { CommonInputModule } from './modules/commonInput.js?v=20260921_01';
import { DiagnosisResultViewModule } from './modules/diagnosisResultView.js?v=20260921_01';
import { Menu1DependentModule } from './modules/menu1Dependent.js?v=20260921_01';
import { Menu2LocalModule } from './modules/menu2Local.js?v=20260921_01';

// 화면별 헤더 아이콘 정의 (하단 글로벌 내비게이션 아이콘과 1:1 일치)
const PAGE_HEADER_ICONS = {
  commonInput: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  `,
  diagnosisResult: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18h6"></path>
      <path d="M10 22h4"></path>
      <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
    </svg>
  `,
  menu1: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <polyline points="16 11 18 13 22 9"></polyline>
    </svg>
  `,
  menu2: `
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
  `
};

class App {
  constructor() {
    this.landingModule = null;
    this.commonModule = null;
    this.diagnosisModule = null;
    this.menu1Module = null;
    this.menu2Module = null;

    this.currentView = 'landing';
  }

  init() {
    // 1. 모듈 인스턴스 생성 및 화면 전환 콜백 연결
    this.landingModule = new Menu0LandingModule('pane-landing', () => {
      this.switchView('commonInput');
    });

    this.commonModule = new CommonInputModule('pane-common', () => {
      this.switchView('diagnosisResult');
    });

    this.diagnosisModule = new DiagnosisResultViewModule(
      'pane-diagnosis',
      (detailTab) => {
        this.switchView(detailTab);
      },
      () => {
        this.switchView('commonInput');
      }
    );

    this.menu1Module = new Menu1DependentModule(
      'pane-menu1', 
      () => {
        this.switchView('diagnosisResult');
      },
      () => {
        this.switchView('diagnosisResult');
      }
    );

    this.menu2Module = new Menu2LocalModule(
      'pane-menu2',
      () => {
        this.switchView('diagnosisResult');
      },
      () => {
        this.switchView('commonInput');
      }
    );

    // 모듈 초기 렌더링
    this.landingModule.init();
    this.commonModule.init();
    this.diagnosisModule.init();
    this.menu1Module.init();
    this.menu2Module.init();

    // 2. 하단 내비게이션 이벤트 바인딩
    this.bindBottomNavEvents();

    // 3. 글로벌 상태 구독 (데이터 변경 시 모든 모듈 및 헤더 요약 바 실시간 동기화)
    appState.subscribe(() => {
      this.syncAllViews();
    });

    // 4. 초기 뷰 설정 (랜딩 화면)
    this.switchView('landing');

    console.log('🚀 건강보험료 계산기 (2026 최신 법령 시뮬레이터 Master Engine) 정상 가동');
  }

  // 하단 5대 글로벌 메뉴 바 이벤트 바인딩 (홈, 기본정보, 3대 옵션, 피부양자, 지역건보료)
  bindBottomNavEvents() {
    const navItems = [
      { id: 'bnav-home', target: 'landing' },
      { id: 'bnav-input', target: 'commonInput' },
      { id: 'bnav-diagnosis', target: 'diagnosisResult' },
      { id: 'bnav-dependent', target: 'menu1' },
      { id: 'bnav-local', target: 'menu2' }
    ];

    navItems.forEach(item => {
      const btn = document.getElementById(item.id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.switchView(item.target);
        });
      }
    });
  }

  // 모든 뷰 및 상단 요약 바 실시간 동기화
  syncAllViews() {
    if (this.commonModule) {
      this.commonModule.updateSummaryBar();
    }
    if (this.diagnosisModule) {
      this.diagnosisModule.render();
      this.diagnosisModule.bindEvents();
    }
    if (this.menu1Module) {
      this.menu1Module.updateGauge();
    }
    if (this.menu2Module) {
      this.menu2Module.render();
      this.menu2Module.bindEvents();
    }
  }

  // 화면 전환 및 헤더 동적 구성
  switchView(viewName) {
    this.currentView = viewName;

    const mainAppHeader = document.getElementById('mainAppHeader');
    const headerBadge = document.getElementById('headerBadge');
    const headerInfoIcon = document.getElementById('headerInfoIcon');
    const headerTitle = document.getElementById('headerTitle');
    const headerTagline = document.getElementById('headerTagline');
    const headerSummaryBar = document.getElementById('headerSummaryBar');

    // 모든 탭 패널 숨기기
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    switch (viewName) {
      case 'landing':
        // 랜딩 화면: 상단 헤더 숨김 (풀스크린 스플래시)
        if (mainAppHeader) mainAppHeader.style.display = 'none';
        if (headerInfoIcon) headerInfoIcon.style.display = 'none';

        document.getElementById('pane-landing')?.classList.add('active');
        if (this.landingModule) {
          this.landingModule.render();
        }
        break;

      case 'commonInput':
        // 공통입력 화면: 기본정보 아이콘 + "재산 및 소득 기본입력"
        if (mainAppHeader) mainAppHeader.style.display = 'block';
        if (headerBadge) headerBadge.style.display = 'none';
        if (headerInfoIcon) {
          headerInfoIcon.style.display = 'inline-flex';
          headerInfoIcon.innerHTML = PAGE_HEADER_ICONS.commonInput;
        }
        if (headerTitle) {
          headerTitle.style.display = 'block';
          headerTitle.textContent = '재산 및 소득 기본입력';
        }
        if (headerTagline) {
          headerTagline.style.display = 'none';
        }
        if (headerSummaryBar) headerSummaryBar.style.display = 'grid';

        document.getElementById('pane-common')?.classList.add('active');
        if (this.commonModule) {
          this.commonModule.refreshInputs();
          this.commonModule.updateSummaryBar();
        }
        break;

      case 'diagnosisResult':
        // 3대 옵션 화면: 3대 옵션 전용 아이콘 + "3대 옵션 결과"
        if (mainAppHeader) mainAppHeader.style.display = 'block';
        if (headerBadge) headerBadge.style.display = 'none';
        if (headerInfoIcon) {
          headerInfoIcon.style.display = 'inline-flex';
          headerInfoIcon.innerHTML = PAGE_HEADER_ICONS.diagnosisResult;
        }
        if (headerTitle) {
          headerTitle.style.display = 'block';
          headerTitle.textContent = '3대 옵션 결과';
        }
        if (headerTagline) {
          headerTagline.style.display = 'block';
          headerTagline.textContent = '피부양자 자격 판정 • 지역가입자 산정 • 임의계속가입 비교';
        }
        if (headerSummaryBar) headerSummaryBar.style.display = 'none';

        document.getElementById('pane-diagnosis')?.classList.add('active');
        if (this.diagnosisModule) {
          this.diagnosisModule.render();
          this.diagnosisModule.bindEvents();
        }
        break;

      case 'menu1':
        // 피부양자 페이지: 피부양자 전용 아이콘 + "피부양자 자격 확인"
        if (mainAppHeader) mainAppHeader.style.display = 'block';
        if (headerBadge) headerBadge.style.display = 'none';
        if (headerInfoIcon) {
          headerInfoIcon.style.display = 'inline-flex';
          headerInfoIcon.innerHTML = PAGE_HEADER_ICONS.menu1;
        }
        if (headerTitle) {
          headerTitle.style.display = 'block';
          headerTitle.textContent = '피부양자 자격 확인';
        }
        if (headerTagline) {
          headerTagline.style.display = 'none';
          headerTagline.textContent = '';
        }
        if (headerSummaryBar) headerSummaryBar.style.display = 'none';

        document.getElementById('pane-menu1')?.classList.add('active');
        if (this.menu1Module) {
          this.menu1Module.updateGauge();
        }
        break;

      case 'menu2':
        // 지역가입자 보험료 산정 상세 페이지: 지역건보료 전용 아이콘 + "지역가입자 보험료 산정"
        if (mainAppHeader) mainAppHeader.style.display = 'block';
        if (headerBadge) headerBadge.style.display = 'none';
        if (headerInfoIcon) {
          headerInfoIcon.style.display = 'inline-flex';
          headerInfoIcon.innerHTML = PAGE_HEADER_ICONS.menu2;
        }
        if (headerTitle) {
          headerTitle.style.display = 'block';
          headerTitle.textContent = '지역가입자 보험료 산정';
        }
        if (headerTagline) {
          headerTagline.style.display = 'none';
          headerTagline.textContent = '';
        }
        if (headerSummaryBar) headerSummaryBar.style.display = 'none';

        document.getElementById('pane-menu2')?.classList.add('active');
        if (this.menu2Module) {
          this.menu2Module.render();
          this.menu2Module.bindEvents();
        }
        break;

      default:
        this.switchView('landing');
        return;
    }

    // 하단 5대 내비게이션 활성 상태 동기화 (홈, 기본정보, 3대 옵션, 피부양자, 지역건보료)
    document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
    if (viewName === 'landing') {
      document.getElementById('bnav-home')?.classList.add('active');
    } else if (viewName === 'commonInput') {
      document.getElementById('bnav-input')?.classList.add('active');
    } else if (viewName === 'diagnosisResult') {
      document.getElementById('bnav-diagnosis')?.classList.add('active');
    } else if (viewName === 'menu1') {
      document.getElementById('bnav-dependent')?.classList.add('active');
    } else if (viewName === 'menu2') {
      document.getElementById('bnav-local')?.classList.add('active');
    }

    // 최상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// DOM 로드 시 앱 기동
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});


