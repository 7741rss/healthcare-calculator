/**
 * 헬스케어 가이드 / 건강보험료 계산기 글로벌 공유 상태 관리자 (State Store)
 * 
 * 1. 피부양자 확인 (메뉴 1)에서 입력한 소득/재산/가족 데이터는 
 *    지역가입자 보험료 산정 (메뉴 2) 및 임의가입 (메뉴 3)에 실시간으로 공유됩니다.
 * 2. 구독자 패턴(Pub/Sub)을 통해 값이 변경될 때마다 등록된 UI 컴포넌트가 자동 리렌더링됩니다.
 * 3. 스토리지 로드/저장 시 데이터 무결성 검증기(Sanitizer)를 통해 캐시 오염 및 결측치를 안전하게 방어합니다.
 */

import { cleanNumber } from './rules/healthData2026.js';

class AppStateStore {
  constructor() {
    this.state = this.getDefaultState();
    this.listeners = [];
    this.loadFromStorage();
  }

  // 기본 클린 상태 반환
  getDefaultState() {
    return {
      currentView: 'landing',   // 'landing' | 'commonInput' | 'diagnosisResult' | 'menu1' | 'menu2'
      activeDetailTab: 'menu1', // 'menu1' | 'menu2'
      mode: 'family',           // 'individual' | 'family'
      
      // 본인 기준 소득 및 재산 데이터 (원 단위)
      primaryUser: {
        id: 'primary',
        name: '본인',
        relationship: 'self',
        hasBusinessReg: false,  // 사업자등록 여부
        
        // 6대 소득 항목
        businessIncome: 0,      // 1. 사업(임대)소득 (100% 반영)
        laborIncome: 0,         // 2. 근로소득 (50% 반영)
        interestIncome: 0,      // 3. 이자소득 (100% 반영)
        dividendIncome: 0,      // 4. 배당소득 (100% 반영)
        pensionIncome: 0,       // 5. 공적연금 (50% 반영)
        otherIncome: 0,         // 6. 기타소득 (100% 반영)
        
        // 재산 항목 (총 과세표준 및 세부 4개 항목)
        propertyTaxBase: 0,     // 재산세 과세표준 총합
        propHouse: 0,           // 1. 아파트(주택)
        propBuilding: 0,        // 2. 건물
        propLand: 0,            // 3. 토지
        propShipPlane: 0,       // 4. 선박/항공기
      },
      
      // 세대/가족 구성원 목록
      familyMembers: [],
      
      // 임의계속가입 관련 데이터
      voluntary: {
        prevWorkHealthFee: 0,   // 퇴직 전 직장 본인부담 건강보험료 (월)
        noticeReceiveDate: '',  // 첫 지역건강보험료 고지서 수령일 (YYYY-MM-DD)
      }
    };
  }

  // 사용자 객체 데이터 정제 (Sanitization)
  sanitizeUserData(rawUser = {}) {
    const u = { ...rawUser };
    
    // 레거시 필드 마이그레이션 호환
    if (u.laborPensionIncome !== undefined && u.laborIncome === undefined) {
      u.laborIncome = cleanNumber(u.laborPensionIncome);
      u.pensionIncome = 0;
    }
    if (u.interestDividendIncome !== undefined && u.interestIncome === undefined) {
      u.interestIncome = cleanNumber(u.interestDividendIncome);
      u.dividendIncome = 0;
    }

    const propHouse = cleanNumber(u.propHouse);
    const propBuilding = cleanNumber(u.propBuilding);
    const propLand = cleanNumber(u.propLand);
    const propShipPlane = cleanNumber(u.propShipPlane);
    const sum4 = propHouse + propBuilding + propLand + propShipPlane;

    return {
      id: u.id || 'primary',
      name: u.name || '본인',
      relationship: u.relationship || 'self',
      hasBusinessReg: !!u.hasBusinessReg,
      businessIncome: cleanNumber(u.businessIncome),
      laborIncome: cleanNumber(u.laborIncome),
      interestIncome: cleanNumber(u.interestIncome),
      dividendIncome: cleanNumber(u.dividendIncome),
      pensionIncome: cleanNumber(u.pensionIncome),
      otherIncome: cleanNumber(u.otherIncome),
      propHouse,
      propBuilding,
      propLand,
      propShipPlane,
      propertyTaxBase: sum4 > 0 ? sum4 : cleanNumber(u.propertyTaxBase),
    };
  }
  
  // 로컬 스토리지에 영구 저장
  saveToStorage() {
    try {
      localStorage.setItem('healthcare_calc_state', JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  // 로컬 스토리지에서 복원 (무결성 검증 및 데이터 정제)
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('healthcare_calc_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanPrimary = this.sanitizeUserData(parsed.primaryUser || {});
          
          const cleanFamily = Array.isArray(parsed.familyMembers) 
            ? parsed.familyMembers.map((m, idx) => ({
                id: m.id || ('family_' + Date.now() + '_' + idx),
                name: m.name || `가족 ${idx + 1}`,
                relationship: m.relationship || '배우자',
                hasBusinessReg: !!m.hasBusinessReg,
                businessIncome: cleanNumber(m.businessIncome),
                laborIncome: cleanNumber(m.laborIncome),
                interestIncome: cleanNumber(m.interestIncome),
                dividendIncome: cleanNumber(m.dividendIncome),
                pensionIncome: cleanNumber(m.pensionIncome),
                otherIncome: cleanNumber(m.otherIncome),
                propHouse: cleanNumber(m.propHouse),
                propBuilding: cleanNumber(m.propBuilding),
                propLand: cleanNumber(m.propLand),
                propShipPlane: cleanNumber(m.propShipPlane),
                propertyTaxBase: cleanNumber(m.propertyTaxBase)
              }))
            : [];

          const cleanVoluntary = {
            prevWorkHealthFee: cleanNumber(parsed.voluntary?.prevWorkHealthFee),
            noticeReceiveDate: typeof parsed.voluntary?.noticeReceiveDate === 'string' ? parsed.voluntary.noticeReceiveDate : ''
          };

          this.state = {
            ...this.getDefaultState(),
            currentView: 'landing', // 항상 랜딩 화면으로 시작
            activeDetailTab: parsed.activeDetailTab || 'menu1',
            mode: parsed.mode || 'family',
            primaryUser: cleanPrimary,
            familyMembers: cleanFamily,
            voluntary: cleanVoluntary
          };
          return true;
        }
      }
    } catch (e) {
      console.error('Storage load error (auto-resetting to default):', e);
    }
    return false;
  }

  // 모든 데이터 초기화
  reset() {
    this.state = this.getDefaultState();
    try {
      localStorage.removeItem('healthcare_calc_state');
    } catch (e) {}
    this.notify('all');
  }
  
  // 상태 조회
  getState() {
    return this.state;
  }
  
  // 리스너 등록
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // 리스너 알림
  notify(changedKey) {
    this.listeners.forEach(fn => fn(this.state, changedKey));
  }
  
  // 뷰 화면 전환
  setView(viewName, params = {}) {
    this.state.currentView = viewName;
    if (params.detailTab) {
      this.state.activeDetailTab = params.detailTab;
    }
    this.notify('currentView');
  }
  
  // 상세 탭 변경
  setTab(tab) {
    this.state.activeDetailTab = tab;
    this.notify('activeDetailTab');
  }
  
  // 모드 변경 (1인 / 가족)
  setMode(mode) {
    this.state.mode = mode;
    this.notify('mode');
  }
  
  // 본인 데이터 업데이트
  updatePrimaryUser(field, value) {
    if (field === 'hasBusinessReg') {
      this.state.primaryUser.hasBusinessReg = !!value;
    } else {
      this.state.primaryUser[field] = typeof value === 'number' ? cleanNumber(value) : value;
    }
    this.notify('primaryUser');
  }
  
  // 본인 전체 데이터 세트
  setPrimaryUser(data) {
    this.state.primaryUser = this.sanitizeUserData({ ...this.state.primaryUser, ...data });
    this.notify('primaryUser');
  }
  
  // 가족 구성원 추가
  addFamilyMember(member = {}) {
    const newMember = {
      id: 'family_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: member.name || `가족 ${this.state.familyMembers.length + 1}`,
      relationship: member.relationship || '배우자',
      hasBusinessReg: !!member.hasBusinessReg,
      businessIncome: cleanNumber(member.businessIncome),
      laborIncome: cleanNumber(member.laborIncome),
      interestIncome: cleanNumber(member.interestIncome),
      dividendIncome: cleanNumber(member.dividendIncome),
      pensionIncome: cleanNumber(member.pensionIncome),
      otherIncome: cleanNumber(member.otherIncome),
      propHouse: cleanNumber(member.propHouse),
      propBuilding: cleanNumber(member.propBuilding),
      propLand: cleanNumber(member.propLand),
      propShipPlane: cleanNumber(member.propShipPlane),
      propertyTaxBase: cleanNumber(member.propertyTaxBase),
    };
    this.state.familyMembers.push(newMember);
    this.notify('familyMembers');
    return newMember;
  }
  
  // 가족 구성원 업데이트
  updateFamilyMember(id, field, value) {
    const member = this.state.familyMembers.find(m => m.id === id);
    if (member) {
      if (field === 'hasBusinessReg') {
        member.hasBusinessReg = !!value;
      } else {
        member[field] = typeof value === 'number' ? cleanNumber(value) : value;
      }
      this.notify('familyMembers');
    }
  }
  
  // 가족 구성원 삭제
  removeFamilyMember(id) {
    this.state.familyMembers = this.state.familyMembers.filter(m => m.id !== id);
    this.notify('familyMembers');
  }
  
  // 임의가입 정보 업데이트
  updateVoluntary(field, value) {
    if (field === 'prevWorkHealthFee') {
      this.state.voluntary.prevWorkHealthFee = cleanNumber(value);
    } else {
      this.state.voluntary[field] = value;
    }
    this.notify('voluntary');
  }

  // 본인 개인 재산 합계 (4개 세부항목 합산)
  getPersonalProperty() {
    const u = this.state.primaryUser || {};
    const propHouse = cleanNumber(u.propHouse);
    const propBuilding = cleanNumber(u.propBuilding);
    const propLand = cleanNumber(u.propLand);
    const propShipPlane = cleanNumber(u.propShipPlane);
    const sum4 = propHouse + propBuilding + propLand + propShipPlane;
    const total = sum4 > 0 ? sum4 : cleanNumber(u.propertyTaxBase);
    return { propHouse, propBuilding, propLand, propShipPlane, total };
  }

  // 세대 전체 항목별 합산 재산 반환 (본인 + 모든 세대원 4개 세부 항목)
  getHouseholdPropertyByCategory(includeFamily = true) {
    const u = this.state.primaryUser || {};
    const totals = {
      propHouse: cleanNumber(u.propHouse),
      propBuilding: cleanNumber(u.propBuilding),
      propLand: cleanNumber(u.propLand),
      propShipPlane: cleanNumber(u.propShipPlane),
    };

    if (includeFamily && this.state.familyMembers && this.state.familyMembers.length > 0) {
      this.state.familyMembers.forEach(m => {
        totals.propHouse += cleanNumber(m.propHouse);
        totals.propBuilding += cleanNumber(m.propBuilding);
        totals.propLand += cleanNumber(m.propLand);
        totals.propShipPlane += cleanNumber(m.propShipPlane);
      });
    }

    totals.total = totals.propHouse + totals.propBuilding + totals.propLand + totals.propShipPlane;
    return totals;
  }
  
  // 본인 개인 소득 항목별 및 총합
  getPersonalIncome() {
    const u = this.state.primaryUser || {};
    const businessIncome = cleanNumber(u.businessIncome);
    const laborIncome = cleanNumber(u.laborIncome);
    const interestIncome = cleanNumber(u.interestIncome);
    const dividendIncome = cleanNumber(u.dividendIncome);
    const pensionIncome = cleanNumber(u.pensionIncome);
    const otherIncome = cleanNumber(u.otherIncome);
    const totalGross = businessIncome + laborIncome + interestIncome + dividendIncome + pensionIncome + otherIncome;
    const appliedIncome = businessIncome + interestIncome + dividendIncome + otherIncome + (laborIncome * 0.5) + (pensionIncome * 0.5);
    return { businessIncome, laborIncome, interestIncome, dividendIncome, pensionIncome, otherIncome, totalGross, appliedIncome };
  }

  // 세대 전체 항목별 합산 소득 반환 (본인 + 모든 세대원)
  getHouseholdIncomeByCategory(includeFamily = true) {
    const u = this.state.primaryUser || {};
    const totals = {
      businessIncome: cleanNumber(u.businessIncome),
      laborIncome: cleanNumber(u.laborIncome),
      interestIncome: cleanNumber(u.interestIncome),
      dividendIncome: cleanNumber(u.dividendIncome),
      pensionIncome: cleanNumber(u.pensionIncome),
      otherIncome: cleanNumber(u.otherIncome),
    };

    if (includeFamily && this.state.familyMembers && this.state.familyMembers.length > 0) {
      this.state.familyMembers.forEach(m => {
        totals.businessIncome += cleanNumber(m.businessIncome);
        totals.laborIncome += cleanNumber(m.laborIncome);
        totals.interestIncome += cleanNumber(m.interestIncome);
        totals.dividendIncome += cleanNumber(m.dividendIncome);
        totals.pensionIncome += cleanNumber(m.pensionIncome);
        totals.otherIncome += cleanNumber(m.otherIncome);
      });
    }

    totals.totalGross = totals.businessIncome + totals.laborIncome + totals.interestIncome + totals.dividendIncome + totals.pensionIncome + totals.otherIncome;
    totals.appliedIncome = totals.businessIncome + totals.interestIncome + totals.dividendIncome + totals.otherIncome + (totals.laborIncome * 0.5) + (totals.pensionIncome * 0.5);
    return totals;
  }

  // 총 합산 소득 계산 (본인 또는 세대 전체: 6대 소득 100% 합산)
  getTotalGrossIncome(includeFamily = false) {
    return includeFamily ? this.getHouseholdIncomeByCategory(true).totalGross : this.getPersonalIncome().totalGross;
  }
  
  // 건강보험료 산정용 연간 반영 소득 (근로/공적연금 50% 반영, 타소득 100% 반영)
  getAppliedAnnualIncome(includeFamily = false) {
    return includeFamily ? this.getHouseholdIncomeByCategory(true).appliedIncome : this.getPersonalIncome().appliedIncome;
  }
  
  // 총 재산세 과세표준
  getTotalPropertyTaxBase(includeFamily = false) {
    return includeFamily ? this.getHouseholdPropertyByCategory(true).total : this.getPersonalProperty().total;
  }

  // 본인(세대주) 재산 총액
  getIndividualPropertyTotal() {
    return this.getPersonalProperty().total;
  }

  // 본인(세대주) 소득 총액
  getIndividualIncomeTotal() {
    return this.getPersonalIncome().totalGross;
  }

  // 세대 합산 재산 총액
  getHouseholdPropertyTotal() {
    return this.getHouseholdPropertyByCategory(true).total;
  }

  // 세대 합산 소득 총액
  getHouseholdIncomeTotal() {
    return this.getHouseholdIncomeByCategory(true).totalGross;
  }
}

export const appState = new AppStateStore();
