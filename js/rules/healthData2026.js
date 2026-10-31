/**
 * 2026년 국민건강보험공단 최신 개정 법령 기준 마스터 데이터베이스 및 산식 엔진 (SSOT)
 * 
 * 1. 피부양자 자격 요건:
 *    - 소득 2,000만 원 이하 (연간 합산)
 *    - 재산 과표 5.4억 이하: 소득 2,000만 원 이하
 *    - 재산 과표 5.4억 초과 ~ 9억 이하: 소득 1,000만 원 이하
 *    - 재산 과표 9억 초과: 피부양자 탈락
 *    - 사업자등록 유: 사업소득 1원 발생 시 탈락
 *    - 사업자등록 무: 사업소득 500만 원 초과 시 탈락
 * 
 * 2. 지역가입자 산정 기준 (2026 최신 기준):
 *    - 자동차 재산 부과 '전면 폐지' (0원 / 제외)
 *    - 재산세 과세표준 1억 원 일괄 기본공제
 *    - 근로·연금소득(공적연금) 50% 반영 (50% 공제)
 *    - 이자·배당·사업·기타소득 100% 반영
 *    - 소득정률제: 소득 1,000만 원 이상 시 소득월액(연소득 ÷ 12) × 7.19% (1,000만 원 미만 소득 건보료 0원)
 *    - 최저 건강보험료: 월 19,780원 (하한선)
 *    - 재산 부과점수당 단가: 211.5원 (국민건강보험법 시행령 [별표 4] 1~60등급 매칭)
 *    - 장기요양보험료율: 소득 대비 0.9994% / 건강보험료의 13.90% (0.009994 ÷ 0.0719 = 13.89986%)
 * 
 * 3. 임의계속가입 산정 기준:
 *    - 퇴직 전 직장 본인부담 건강보험료(장기요양 포함) 최대 36개월 유지
 *    - 보수외 소득 2,000만 원 초과 시 소득월액 추가보험료(7.19% + 장기요양 13.90%) 합산
 */

export const HEALTH_DATABASE_2026 = {
  VERSION: '2027.01.01_v20261031',
  LAST_UPDATED: '2026-10-31',
  
  // 1. 법정 공식 요율 및 단가 마스터
  RATES: {
    HEALTH_RATE: 0.0719,                  // 직장 및 지역 소득정률 건강보험료율 7.19% (동결)
    POINT_UNIT_PRICE: 211.5,              // 재산 부과점수당 211.5원 (동결)
    LONG_TERM_CARE_INCOME_RATE: 0.009994, // 소득(보수월액) 대비 장기요양보험료율 0.9994% (2027년 개정 인상)
    LONG_TERM_CARE_CONVERSION_RATE: 0.009994 / 0.0719, // 건보료 대비 장기요양보험료율 13.90% (0.009994 ÷ 0.0719)
    MIN_MONTHLY_HEALTH_FEE: 19780,        // 법정 최저 월 건강보험료 19,780원
  },

  // 2. 공제 및 면제 기준선 마스터
  THRESHOLDS: {
    PROPERTY_BASIC_DEDUCTION: 100000000,  // 재산 과표 일괄 기본공제 1억 원 (100,000,000원)
    INCOME_EXCLUSION_THRESHOLD: 10000000, // 소득 합산 제외 기준선 1,000만 원 (10,000,000원)
    INCOME_THRESHOLD_FOR_MIN: 3360000,    // 과거 점수제 최저점수 적용 기준선 (연 336만원)
    VOLUNTARY_EXCESS_THRESHOLD: 20000000, // 임의계속가입 보수외 소득 공제 기준선 2,000만 원
  },

  // 3. 소득 유형별 반영률 마스터
  INCOME_RATIOS: {
    LABOR: 0.50,      // 근로소득 50% 반영 (50% 공제)
    PENSION: 0.50,    // 공적연금소득 50% 반영 (50% 공제)
    BUSINESS: 1.00,   // 사업(임대)소득 100% 반영
    INTEREST: 1.00,   // 이자소득 100% 반영
    DIVIDEND: 1.00,   // 배당소득 100% 반영
    OTHER: 1.00       // 기타소득 100% 반영
  },

  // 4. 피부양자 자격 판정 기준 마스터
  DEPENDENT: {
    MAX_TOTAL_INCOME_STANDARD: 20000000,     // 과표 5.4억 이하 시 소득 한도 2,000만 원
    MAX_TOTAL_INCOME_MID_PROPERTY: 10000000, // 과표 5.4억~9억 구간 소득 한도 1,000만 원
    PROPERTY_TIER_1: 540000000,              // 5.4억 원
    PROPERTY_TIER_2: 900000000,              // 9.0억 원 (초과 시 탈락)
    BUSINESS_NO_REG_MAX: 5000000,            // 사업자등록 없을 때 사업소득 한도 500만 원
  },

  // 5. 국민건강보험법 시행령 제42조제1항 [별표 4] 재산 부과등급별 점수표 (1~60등급)
  PROPERTY_TIER_TABLE: [
    { grade: 1, min: 0, max: 4500000, points: 22 },
    { grade: 2, min: 4500000, max: 9000000, points: 44 },
    { grade: 3, min: 9000000, max: 13500000, points: 66 },
    { grade: 4, min: 13500000, max: 18000000, points: 97 },
    { grade: 5, min: 18000000, max: 22500000, points: 122 },
    { grade: 6, min: 22500000, max: 27000000, points: 146 },
    { grade: 7, min: 27000000, max: 31500000, points: 171 },
    { grade: 8, min: 31500000, max: 36000000, points: 195 },
    { grade: 9, min: 36000000, max: 40500000, points: 219 },
    { grade: 10, min: 40500000, max: 45000000, points: 244 },
    { grade: 11, min: 45000000, max: 50200000, points: 268 },
    { grade: 12, min: 50200000, max: 55900000, points: 294 },
    { grade: 13, min: 55900000, max: 62200000, points: 320 },
    { grade: 14, min: 62200000, max: 69300000, points: 344 },
    { grade: 15, min: 69300000, max: 77100000, points: 365 },
    { grade: 16, min: 77100000, max: 85900000, points: 386 },
    { grade: 17, min: 85900000, max: 95700000, points: 412 },
    { grade: 18, min: 95700000, max: 107000000, points: 439 },
    { grade: 19, min: 107000000, max: 119000000, points: 465 },
    { grade: 20, min: 119000000, max: 133000000, points: 490 },
    { grade: 21, min: 133000000, max: 148000000, points: 516 },
    { grade: 22, min: 148000000, max: 164000000, points: 535 },
    { grade: 23, min: 164000000, max: 183000000, points: 559 },
    { grade: 24, min: 183000000, max: 204000000, points: 586 },
    { grade: 25, min: 204000000, max: 227000000, points: 611 },
    { grade: 26, min: 227000000, max: 253000000, points: 637 },
    { grade: 27, min: 253000000, max: 281000000, points: 659 },
    { grade: 28, min: 281000000, max: 313000000, points: 681 },
    { grade: 29, min: 313000000, max: 349000000, points: 706 },
    { grade: 30, min: 349000000, max: 388000000, points: 731 },
    { grade: 31, min: 388000000, max: 432000000, points: 757 },
    { grade: 32, min: 432000000, max: 481000000, points: 785 },
    { grade: 33, min: 481000000, max: 536000000, points: 812 },
    { grade: 34, min: 536000000, max: 597000000, points: 841 },
    { grade: 35, min: 597000000, max: 665000000, points: 881 },
    { grade: 36, min: 665000000, max: 740000000, points: 921 },
    { grade: 37, min: 740000000, max: 824000000, points: 961 },
    { grade: 38, min: 824000000, max: 918000000, points: 1001 },
    { grade: 39, min: 918000000, max: 1030000000, points: 1041 },
    { grade: 40, min: 1030000000, max: 1140000000, points: 1091 },
    { grade: 41, min: 1140000000, max: 1270000000, points: 1141 },
    { grade: 42, min: 1270000000, max: 1420000000, points: 1191 },
    { grade: 43, min: 1420000000, max: 1580000000, points: 1241 },
    { grade: 44, min: 1580000000, max: 1760000000, points: 1291 },
    { grade: 45, min: 1760000000, max: 1960000000, points: 1341 },
    { grade: 46, min: 1960000000, max: 2180000000, points: 1391 },
    { grade: 47, min: 2180000000, max: 2420000000, points: 1451 },
    { grade: 48, min: 2420000000, max: 2700000000, points: 1511 },
    { grade: 49, min: 2700000000, max: 3000000000, points: 1571 },
    { grade: 50, min: 3000000000, max: 3340000000, points: 1631 },
    { grade: 51, min: 3340000000, max: 3700000000, points: 1691 },
    { grade: 52, min: 3700000000, max: 4100000000, points: 1751 },
    { grade: 53, min: 4100000000, max: 4550000000, points: 1821 },
    { grade: 54, min: 4550000000, max: 5050000000, points: 1891 },
    { grade: 55, min: 5050000000, max: 5600000000, points: 1961 },
    { grade: 56, min: 5600000000, max: 6200000000, points: 2031 },
    { grade: 57, min: 6200000000, max: 6850000000, points: 2101 },
    { grade: 58, min: 6850000000, max: 7073850000, points: 2181 },
    { grade: 59, min: 7073850000, max: 7781240000, points: 2271 },
    { grade: 60, min: 7781240000, max: Infinity, points: 2341 }
  ]
};

// 기존 코드와의 100% 호환성을 위한 alias export
export const HEALTH_RULES_2026 = {
  HEALTH_RATE: HEALTH_DATABASE_2026.RATES.HEALTH_RATE,
  POINT_UNIT_PRICE: HEALTH_DATABASE_2026.RATES.POINT_UNIT_PRICE,
  LONG_TERM_CARE_RATE: HEALTH_DATABASE_2026.RATES.LONG_TERM_CARE_CONVERSION_RATE,
  LONG_TERM_CARE_INCOME_RATE: HEALTH_DATABASE_2026.RATES.LONG_TERM_CARE_INCOME_RATE,
  MIN_MONTHLY_HEALTH_FEE: HEALTH_DATABASE_2026.RATES.MIN_MONTHLY_HEALTH_FEE,
  INCOME_EXCLUSION_THRESHOLD: HEALTH_DATABASE_2026.THRESHOLDS.INCOME_EXCLUSION_THRESHOLD,
  INCOME_THRESHOLD_FOR_MIN: HEALTH_DATABASE_2026.THRESHOLDS.INCOME_THRESHOLD_FOR_MIN,
  PROPERTY_BASIC_DEDUCTION: HEALTH_DATABASE_2026.THRESHOLDS.PROPERTY_BASIC_DEDUCTION,
  LABOR_PENSION_RATIO: HEALTH_DATABASE_2026.INCOME_RATIOS.LABOR,
  GENERAL_INCOME_RATIO: HEALTH_DATABASE_2026.INCOME_RATIOS.BUSINESS,
  DEPENDENT: HEALTH_DATABASE_2026.DEPENDENT,
  PROPERTY_TIER_TABLE: HEALTH_DATABASE_2026.PROPERTY_TIER_TABLE
};

/**
 * 안전한 숫자 파싱 (음수 방어 및 NaN 처리)
 */
export function cleanNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'string') {
    val = val.replace(/[^0-9.-]/g, '');
  }
  const n = Number(val);
  return isNaN(n) ? 0 : Math.max(0, n);
}

/**
 * 숫자에 천 단위 콤마 추가
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  if (typeof num === 'string') {
    num = Number(num.replace(/[^0-9.-]/g, ''));
  }
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('ko-KR');
}

/**
 * 숫자를 한국어 금액 표기로 변환 (예: 150000000 -> 1억 5,000만 원, 0 -> 0원)
 */
export function formatKoreanMoney(amount) {
  const cleanVal = cleanNumber(amount);
  if (cleanVal === 0) return '0원';
  
  const absAmount = Math.abs(Math.round(cleanVal));
  const eok = Math.floor(absAmount / 100000000);
  const man = Math.floor((absAmount % 100000000) / 10000);
  const won = absAmount % 10000;
  
  let result = '';
  if (eok > 0) result += `${eok}억 `;
  if (man > 0) result += `${man.toLocaleString()}만 `;
  if (won > 0 && eok === 0 && man === 0) result += `${won.toLocaleString()}`;
  
  return (result.trim() || '0') + '원';
}

/**
 * 국민건강보험법 시행령 [별표 4] 재산등급별 점수표 기준 재산 부과등급 및 점수 산출
 * 
 * @param {number} netPropertyTaxBase 기본공제(1억 원) 차감 후 과세표준
 * @returns {object} { grade, points, min, max, rangeStr, feeEst }
 */
export function getPropertyPoints(netPropertyTaxBase) {
  const net = cleanNumber(netPropertyTaxBase);

  // 공제 후 과세표준이 0원 이하인 경우: 재산 부과 점수 0점 (전액 감면)
  if (net <= 0) {
    return {
      grade: 0,
      points: 0,
      min: 0,
      max: 0,
      rangeStr: '1억 원 이하 (기본공제로 전액 감면)',
      feeEst: 0
    };
  }
  
  // 1등급 ~ 60등급 Range Lookup 매칭 (min 초과 ~ max 이하)
  for (const tier of HEALTH_DATABASE_2026.PROPERTY_TIER_TABLE) {
    if (net <= tier.max) {
      const minText = tier.min === 0 ? '0원' : formatKoreanMoney(tier.min);
      const maxText = tier.max === Infinity ? '초과' : formatKoreanMoney(tier.max);
      const rangeStr = tier.grade === 1 
        ? `${maxText} 이하`
        : (tier.max === Infinity 
            ? `${minText} 초과`
            : `${minText} 초과 ~ ${maxText} 이하`);
        
      return {
        grade: tier.grade,
        points: tier.points,
        min: tier.min,
        max: tier.max,
        rangeStr: rangeStr,
        feeEst: Math.round(tier.points * HEALTH_DATABASE_2026.RATES.POINT_UNIT_PRICE)
      };
    }
  }

  // 60등급 상한선 초과 시
  const last = HEALTH_DATABASE_2026.PROPERTY_TIER_TABLE[HEALTH_DATABASE_2026.PROPERTY_TIER_TABLE.length - 1];
  return {
    grade: last.grade,
    points: last.points,
    min: last.min,
    max: last.max,
    rangeStr: `${formatKoreanMoney(last.min)} 초과`,
    feeEst: Math.round(last.points * HEALTH_DATABASE_2026.RATES.POINT_UNIT_PRICE)
  };
}

/**
 * 지역가입자 소득 건강보험료 산정 함수
 * 1) 총 반영소득이 1,000만 원 미만: 소득합산에서 제외 (소득 건보료 = 0원)
 * 2) 1,000만 원 이상: 소득월액(연소득 ÷ 12) × 7.19%
 * 
 * @param {number} appliedAnnualIncome 소득별 반영률(근로·연금 50%, 타소득 100%) 적용 후 연간 합산 소득금액
 * @returns {object} { isExcluded, appliedAnnualIncome, monthlyIncome, monthlyFee, formulaStr }
 */
export function calculateIncomeHealthFee(appliedAnnualIncome) {
  const S = cleanNumber(appliedAnnualIncome);
  const threshold = HEALTH_DATABASE_2026.THRESHOLDS.INCOME_EXCLUSION_THRESHOLD; // 10,000,000원
  const rate = HEALTH_DATABASE_2026.RATES.HEALTH_RATE;                         // 0.0719 (7.19%)

  if (S < threshold) {
    return {
      isExcluded: true,
      appliedAnnualIncome: S,
      monthlyIncome: Math.round(S / 12),
      monthlyFee: 0,
      formulaStr: '연간 소득 1,000만 원 미만 ➔ 소득 합산 제외 (소득 보험료 0원)'
    };
  }

  const monthlyIncome = S / 12;
  const monthlyFee = Math.round(monthlyIncome * rate);

  return {
    isExcluded: false,
    appliedAnnualIncome: S,
    monthlyIncome: Math.round(monthlyIncome),
    monthlyFee: monthlyFee,
    formulaStr: `소득월액 ${formatNumber(Math.round(monthlyIncome))}원 (${formatNumber(S)}원 ÷ 12개월) × 7.19% = ${formatNumber(monthlyFee)}원`
  };
}

/**
 * 지역가입자 건강보험료 및 장기요양보험료 종합 산출 엔진
 * 
 * @param {number} grossPropertyTaxBase 총 재산세 과세표준
 * @param {number} appliedAnnualIncome 연간 산정 반영소득
 * @returns {object} { grossProperty, netProperty, propPoints, monthlyPropFee, monthlyIncomeFee, healthSubtotal, isMinApplied, monthlyLtcFee, totalMonthlyFee, propTier }
 */
export function calculateLocalHealthFeeDetailed(grossPropertyTaxBase, appliedAnnualIncome, grossAnnualIncome = 0) {
  let grossProp = 0;
  let appliedInc = 0;
  let grossInc = 0;

  // AppStateStore 인스턴스가 첫 번째 인자로 전달된 경우 자동 세대합산 추출
  if (grossPropertyTaxBase && typeof grossPropertyTaxBase.getHouseholdPropertyByCategory === 'function') {
    const propObj = grossPropertyTaxBase.getHouseholdPropertyByCategory(true);
    const incObj = grossPropertyTaxBase.getHouseholdIncomeByCategory(true);
    grossProp = propObj.total;
    appliedInc = incObj.appliedIncome;
    grossInc = incObj.totalGross;
  } else {
    grossProp = cleanNumber(grossPropertyTaxBase);
    appliedInc = cleanNumber(appliedAnnualIncome);
    grossInc = cleanNumber(grossAnnualIncome) || appliedInc;
  }

  // 1. 재산 건보료 산출 (1억 원 기본공제 적용)
  const netProp = Math.max(0, grossProp - HEALTH_DATABASE_2026.THRESHOLDS.PROPERTY_BASIC_DEDUCTION);
  const propTier = getPropertyPoints(netProp);
  const monthlyPropFee = Math.round(propTier.points * HEALTH_DATABASE_2026.RATES.POINT_UNIT_PRICE);

  // 2. 소득 건보료 산출 (1,000만 원 미만 면제, 1,000만 이상 7.19% 정률)
  const incResult = calculateIncomeHealthFee(appliedInc);
  const monthlyIncomeFee = incResult.monthlyFee;

  // 3. 건보료 합계 및 최저보험료(19,780원) 하한선 적용
  const rawSumHealth = monthlyPropFee + monthlyIncomeFee;
  const minHealth = HEALTH_DATABASE_2026.RATES.MIN_MONTHLY_HEALTH_FEE;
  const healthSubtotal = Math.max(minHealth, rawSumHealth);
  const isMinApplied = rawSumHealth < minHealth;

  // 4. 장기요양보험료 산출: (건보료 소계 × 0.009994) ÷ 0.0719 = 13.90%
  const monthlyLtcFee = Math.round((healthSubtotal * HEALTH_DATABASE_2026.RATES.LONG_TERM_CARE_INCOME_RATE) / HEALTH_DATABASE_2026.RATES.HEALTH_RATE);

  // 5. 총 월 납부 예상액
  const totalMonthlyFee = healthSubtotal + monthlyLtcFee;

  return {
    // 재산 관련
    rawPropertyTaxBase: grossProp,
    grossProperty: grossProp,
    netPropertyTaxBase: netProp,
    netProperty: netProp,
    propertyPoints: propTier.points,
    propPoints: propTier.points,
    propertyGrade: propTier.grade,
    propGrade: propTier.grade,
    propertyFee: monthlyPropFee,
    monthlyPropFee,

    // 소득 관련
    grossAnnualIncome: grossInc,
    appliedAnnualIncome: appliedInc,
    monthlyAppliedIncome: incResult.monthlyIncome,
    monthlyIncome: incResult.monthlyIncome,
    isIncomeExempt: incResult.isExcluded,
    isExcluded: incResult.isExcluded,
    incomeFee: monthlyIncomeFee,
    monthlyIncomeFee,
    incomeResult: incResult,

    // 합산 및 요양 관련
    pureHealthFee: healthSubtotal,
    healthSubtotal,
    isMinApplied,
    longTermCareFee: monthlyLtcFee,
    monthlyLtcFee,
    monthlyTotalFee: totalMonthlyFee,
    totalMonthlyFee,
    propTier
  };
}

/**
 * 임의계속가입자 보수외 소득(소득월액보험료) 추가 산정 함수
 * 
 * @param {number} annualIncome 임의계속가입자 연간 보수외 소득 (원)
 * @returns {object} { annualIncome, threshold, excessAnnual, monthlyExcess, additionalHealthFee, additionalLongTermFee, totalAdditionalMonthlyFee, isExcess }
 */
export function calculateVoluntaryAdditionalIncomeFee(annualIncome) {
  const S = cleanNumber(annualIncome);
  const threshold = HEALTH_DATABASE_2026.THRESHOLDS.VOLUNTARY_EXCESS_THRESHOLD; // 20,000,000원
  const isExcess = S > threshold;
  const excessAnnual = Math.max(0, S - threshold);
  const monthlyExcess = excessAnnual > 0 ? excessAnnual / 12 : 0;
  const additionalHealthFee = Math.round(monthlyExcess * HEALTH_DATABASE_2026.RATES.HEALTH_RATE);
  const additionalLongTermFee = additionalHealthFee > 0 
    ? Math.round((additionalHealthFee * HEALTH_DATABASE_2026.RATES.LONG_TERM_CARE_INCOME_RATE) / HEALTH_DATABASE_2026.RATES.HEALTH_RATE)
    : 0;
  const totalAdditionalMonthlyFee = additionalHealthFee + additionalLongTermFee;

  return {
    annualIncome: S,
    threshold,
    excessAnnual,
    monthlyExcess: Math.round(monthlyExcess),
    additionalHealthFee,
    additionalLongTermFee,
    totalAdditionalMonthlyFee,
    isExcess
  };
}

/**
 * 임의계속가입 vs 지역가입자 36개월 종합 비교 산출 엔진
 * 
 * @param {number} baseWorkHealthFee 퇴직 전 직장 본인부담 건보료 (월)
 * @param {number} linkedAnnualIncome 연간 보수외 소득 총액
 * @param {number} estimatedLocalMonthlyFee 지역가입자 월 납부 예상액
 * @returns {object} { baseWorkFee, additionalFeeResult, totalVoluntaryMonthlyFee, localMonthlyFee, monthlyDiff, total36MonthSaving, isVoluntaryAdvantage, hasInput }
 */
export function calculateVoluntaryComparisonDetailed(baseWorkHealthFee, linkedAnnualIncome, estimatedLocalMonthlyFee) {
  const baseFee = cleanNumber(baseWorkHealthFee);
  const linkedIncome = cleanNumber(linkedAnnualIncome);
  const localFee = cleanNumber(estimatedLocalMonthlyFee);

  const addResult = calculateVoluntaryAdditionalIncomeFee(linkedIncome);
  const totalVoluntaryMonthlyFee = baseFee + addResult.totalAdditionalMonthlyFee;
  const monthlyDiff = localFee - totalVoluntaryMonthlyFee; // 양수이면 임의가입이 절감됨
  const total36MonthSaving = monthlyDiff * 36;
  const isVoluntaryAdvantage = monthlyDiff > 0 && baseFee > 0;

  return {
    baseFee,
    addResult,
    additionalFee: addResult.totalAdditionalMonthlyFee,
    totalVoluntaryMonthlyFee,
    localMonthlyFee: localFee,
    monthlyDiff,
    total36MonthSaving,
    isVoluntaryAdvantage,
    hasInput: baseFee > 0
  };
}

/**
 * 피부양자 자격 판정 엔진
 * 
 * @param {number} personalPropertyTaxBase 본인 개인 재산세 과세표준
 * @param {number} totalGrossIncome 본인 개인 연간 총소득
 * @param {number} businessIncome 본인 개인 연간 사업소득
 * @param {boolean} hasBusinessReg 사업자등록 여부
 * @returns {object} { isPass, statusText, badgeClass, failReasons, failReasonText, tier }
 */
export function evaluateDependentDetailed(personalPropertyTaxBase, totalGrossIncome, businessIncome, hasBusinessReg) {
  const prop = cleanNumber(personalPropertyTaxBase);
  const income = cleanNumber(totalGrossIncome);
  const busIncome = cleanNumber(businessIncome);
  const hasReg = !!hasBusinessReg;

  let isPass = true;
  let failReasons = [];
  let tier = 1;

  // 1. 사업소득 요건
  if (hasReg && busIncome > 0) {
    isPass = false;
    failReasons.push('사업자등록 있음 & 사업소득 1원 이상 발생');
  } else if (!hasReg && busIncome > HEALTH_DATABASE_2026.DEPENDENT.BUSINESS_NO_REG_MAX) {
    isPass = false;
    failReasons.push('사업자등록 없음 & 사업소득 연 500만 원 초과');
  }

  // 2. 재산 및 소득 복합 요건
  if (prop > HEALTH_DATABASE_2026.DEPENDENT.PROPERTY_TIER_2) {
    // 9억 초과
    isPass = false;
    tier = 3;
    failReasons.push('재산세 과표 9억 원 초과 (소득 무관 탈락)');
  } else if (prop > HEALTH_DATABASE_2026.DEPENDENT.PROPERTY_TIER_1) {
    // 5.4억 초과 ~ 9억 이하
    tier = 2;
    if (income > HEALTH_DATABASE_2026.DEPENDENT.MAX_TOTAL_INCOME_MID_PROPERTY) {
      isPass = false;
      failReasons.push('재산 5.4억~9억 구간 연간 소득 1,000만 원 초과');
    }
  } else {
    // 5.4억 이하
    tier = 1;
    if (income > HEALTH_DATABASE_2026.DEPENDENT.MAX_TOTAL_INCOME_STANDARD) {
      isPass = false;
      failReasons.push('연간 총소득 2,000만 원 초과');
    }
  }

  return {
    isPass,
    tier,
    statusText: isPass ? '자격 충족' : '자격 탈락',
    badgeClass: isPass ? 'badge-pass' : 'badge-fail',
    failReasons,
    failReasonText: failReasons.join(', ') || '요건 충족 (등록 가능)',
    monthlyFee: 0
  };
}

/**
 * 2026년 법정 기준 3대 옵션(피부양자, 지역가입자, 임의가입) 종합 진단 함수
 * 
 * @param {object} appStateInstance AppStateStore 인스턴스
 * @returns {object} { dependent, local, voluntary, evaluatedAt }
 */
export function evaluate3OptionsDiagnosis(appStateInstance) {
  const state = appStateInstance.getState();
  const u = state.primaryUser;

  // 1. 피부양자 판정 (본인 개인 기준)
  const personalProp = appStateInstance.getPersonalProperty().total;
  const personalIncome = appStateInstance.getPersonalIncome();
  const depResult = evaluateDependentDetailed(
    personalProp,
    personalIncome.totalGross,
    personalIncome.businessIncome,
    u.hasBusinessReg
  );

  // 2. 지역가입자 산정 (세대합산 기준)
  const householdProp = appStateInstance.getHouseholdPropertyByCategory(true).total;
  const householdAppliedIncome = appStateInstance.getHouseholdIncomeByCategory(true).appliedIncome;
  const localCalc = calculateLocalHealthFeeDetailed(householdProp, householdAppliedIncome);

  const localResult = {
    monthlyFee: localCalc.totalMonthlyFee,
    healthFee: localCalc.healthSubtotal,
    longTermFee: localCalc.monthlyLtcFee,
    netPropertyTaxBase: localCalc.netProperty,
    appliedIncome: householdAppliedIncome,
    propGrade: localCalc.propGrade,
    propPoints: localCalc.propPoints
  };

  // 3. 임의계속가입 산정 (본인 기준)
  const baseWorkFee = cleanNumber(state.voluntary.prevWorkHealthFee);
  const volCalc = calculateVoluntaryComparisonDetailed(baseWorkFee, personalIncome.totalGross, localCalc.totalMonthlyFee);

  const voluntaryResult = {
    monthlyFee: volCalc.totalVoluntaryMonthlyFee,
    baseFee: baseWorkFee,
    additionalFee: volCalc.additionalFee,
    addResult: volCalc.addResult,
    monthlyDiff: volCalc.monthlyDiff,
    total36MonthSaving: volCalc.total36MonthSaving,
    isVoluntaryAdvantage: volCalc.isVoluntaryAdvantage,
    hasInput: volCalc.hasInput
  };

  return {
    dependent: depResult,
    local: localResult,
    voluntary: voluntaryResult,
    evaluatedAt: new Date().toISOString()
  };
}
