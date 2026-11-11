import { formatCurrency, formatPercent, parseNumber } from './formatters.js';

/**
 * IRS Publication 936 (Table 1 Average Balance Method) & IRC § 163(h) / State Conformity Calculator
 *
 * Implements 4 distinct phases:
 * Phase 1: Individual Loan Balance Calculation (Case 1A, 1B, 1C, 1D)
 * Phase 2: Net Outstanding Mortgage by Loan Structure (Case 2A: Direct, Case 2B: Refinance, Case 2C: 1st & 2nd)
 * Phase 3: Federal Limitation Calculations (Pre-2017: $1M limit, Post-2017: $750K limit; Case 3A, Case 3B)
 * Phase 4: State Limitation Calculations (Pre-2017 vs Post-2017; Case 4A, Case 4B Gap Window, Case 4C Over $1M)
 */
export function calculateMortgageLimits({
  rule = 'post', // 'post' | 'pre' | 'post-2017' | 'pre-2017'
  loanType = 'direct', // 'direct' | 'refinance' | 'first-second' | 'first_second'
  loans = [],
  decimals = 3, // 1 to 5 (default 3)
  descStyle = 'simple', // 'simple' | 'detailed'
}) {
  const isPost2017 = rule === 'post' || rule === 'post-2017';
  const fedLimit = isPost2017 ? 750000 : 1000000;
  const stateCap = 1000000;

  // -------------------------------------------------------------
  // Phase 1: Individual Loan Balance Calculation
  // -------------------------------------------------------------
  const rows = loans.map((loan, idx) => {
    const rawStart = loan.start !== undefined ? loan.start : loan.startBalance;
    const rawEnd = loan.end !== undefined ? loan.end : loan.endBalance;
    const rawInterest = loan.interest !== undefined ? loan.interest : loan.interestPaid;

    const startAmount = parseNumber(rawStart);
    const endAmount = parseNumber(rawEnd);
    const interest = parseNumber(rawInterest);

    const hasStart = String(rawStart ?? '').trim() !== '' && startAmount > 0;
    const hasEnd = String(rawEnd ?? '').trim() !== '' && endAmount > 0;

    let avg = 0;
    let balanceType = 'zero'; // 'both_avg' | 'start_only' | 'end_only' | 'zero'

    if (hasStart && hasEnd) {
      // Case 1A: Both Start & End Balances provided -> (Start Balance + End Balance) / 2
      avg = (startAmount + endAmount) / 2;
      balanceType = 'both_avg';
    } else if (hasStart) {
      // Case 1B: Only Start Balance provided -> Start Balance directly (avoid halving)
      avg = startAmount;
      balanceType = 'start_only';
    } else if (hasEnd) {
      // Case 1C: Only End Balance provided -> End Balance directly
      avg = endAmount;
      balanceType = 'end_only';
    } else {
      // Case 1D: Neither provided -> $0.00 fallback
      avg = startAmount || endAmount || 0;
      balanceType = 'zero';
    }

    const isFirstSecond = loanType === 'first-second' || loanType === 'first_second';
    const defaultName = isFirstSecond
      ? idx === 0 ? '1st loan' : '2nd loan'
      : `Loan ${idx + 1}`;

    return {
      id: loan.id || `loan-${idx + 1}`,
      name: loan.name || defaultName,
      start: rawStart ?? '',
      end: rawEnd ?? '',
      startAmount,
      endAmount,
      hasStart,
      hasEnd,
      balanceType,
      interest,
      avg,
      averageBalance: avg,
      interestPaid: interest,
      endAssumed: balanceType === 'start_only',
    };
  });

  // Total Mortgage Interest = sum of interest paid across all loans
  const totalInterest = rows.reduce((sum, item) => sum + item.interest, 0);

  // -------------------------------------------------------------
  // Phase 2: Net Outstanding Mortgage (By Loan Structure Type)
  // -------------------------------------------------------------
  let outstanding = 0;
  let formulaExplanation = '';

  const normalizedType =
    loanType === 'first_second' ? 'first-second' : loanType;

  if (normalizedType === 'direct') {
    // Case 2A: Direct Loan (Single Continuous Loan)
    // Formula: Net Outstanding Mortgage = Average Balance of Loan 1
    const primary = rows[0] || { startAmount: 0, endAmount: 0, avg: 0, balanceType: 'zero' };
    outstanding = primary.avg;
    if (primary.balanceType === 'both_avg') {
      formulaExplanation = `(${formatCurrency(primary.startAmount)} + ${formatCurrency(primary.endAmount)}) ÷ 2`;
    } else {
      formulaExplanation = formatCurrency(primary.avg);
    }
  } else if (normalizedType === 'refinance') {
    // Case 2B: Refinance (Sequential Replacement Loans)
    // Formula: Net Outstanding Mortgage = (sum of Average Balances) / 2
    const sumAverages = rows.reduce((sum, item) => sum + item.avg, 0);
    outstanding = sumAverages / 2;
    const balanceList = rows.map((r) => formatCurrency(r.avg)).join(' + ');
    formulaExplanation = `(${balanceList}) ÷ 2`;
  } else if (normalizedType === 'first-second') {
    // Case 2C: 1st Loan & 2nd Loan (Concurrent Loans)
    // Formula: Net Outstanding Mortgage = sum of Average Balances
    outstanding = rows.reduce((sum, item) => sum + item.avg, 0);
    const balanceList = rows.map((r) => formatCurrency(r.avg)).join(' + ');
    formulaExplanation = balanceList;
  } else {
    outstanding = rows.reduce((sum, item) => sum + item.avg, 0);
    formulaExplanation = rows.map((r) => formatCurrency(r.avg)).join(' + ');
  }

  // -------------------------------------------------------------
  // Phase 3: Federal Limitation Calculations (IRS Pub 936)
  // -------------------------------------------------------------
  const isFedLimited = outstanding > fedLimit;
  let federalPercent = 100;
  let federalRatio = 1.0;
  let federal = totalInterest;
  let federalDisallowed = 0;

  if (isFedLimited && outstanding > 0) {
    // Case 3B: Over Limit
    // IRS Pub 936 Table 1 Line 13: Enter result as a decimal amount (rounded to three places, e.g. 0.694)
    // The quotient takes 3 decimal digits BEFORE multiplying by 100
    const rawRatio = fedLimit / outstanding;
    const factor = Math.pow(10, decimals);
    federalRatio = Math.round(rawRatio * factor) / factor;
    const pctFactor = Math.pow(10, Math.max(0, decimals - 2));
    federalPercent = Math.round(federalRatio * 100 * pctFactor) / pctFactor;
    federal = Math.round(federalRatio * totalInterest * 100) / 100;
    federalDisallowed = Math.max(0, Math.round((totalInterest - federal) * 100) / 100);
  } else {
    // Case 3A: Within Limit
    federalPercent = 100;
    federalRatio = 1.0;
    federal = totalInterest;
    federalDisallowed = 0;
  }

  // -------------------------------------------------------------
  // Phase 4: State Limitation Calculations (Post-2017 vs Pre-2017)
  // -------------------------------------------------------------
  let statePercent = 100;
  let stateRatio = 1.0;
  let stateTotal = totalInterest;
  let stateAdditional = 0;
  let stateDisallowed = 0;

  if (isPost2017) {
    if (outstanding <= fedLimit) {
      // Case 4A: Net Mortgage <= $750,000
      stateTotal = totalInterest;
      stateAdditional = 0;
      stateDisallowed = 0;
      statePercent = 100;
      stateRatio = 1.0;
    } else if (outstanding <= stateCap) {
      // Case 4B (The Gap): $750,000 < Net Mortgage <= $1,000,000
      stateTotal = totalInterest;
      stateAdditional = Math.max(0, Math.round((totalInterest - federal) * 100) / 100);
      stateDisallowed = 0;
      statePercent = 100;
      stateRatio = 1.0;
    } else {
      // Case 4C: Net Mortgage > $1,000,000
      // Round decimal ratio to specified digits before multiplying by 100 (e.g. 0.926)
      const rawStateRatio = stateCap / outstanding;
      const factor = Math.pow(10, decimals);
      stateRatio = Math.round(rawStateRatio * factor) / factor;
      const pctFactor = Math.pow(10, Math.max(0, decimals - 2));
      statePercent = Math.round(stateRatio * 100 * pctFactor) / pctFactor;
      stateTotal = Math.round(stateRatio * totalInterest * 100) / 100;
      stateAdditional = Math.max(0, Math.round((stateTotal - federal) * 100) / 100);
      stateDisallowed = Math.max(0, Math.round((totalInterest - stateTotal) * 100) / 100);
    }
  } else {
    // Pre-2017 Regime: Federal Limit = State Limit = $1,000,000
    stateTotal = federal;
    stateAdditional = 0;
    stateDisallowed = federalDisallowed;
    statePercent = federalPercent;
    stateRatio = federalRatio;
  }

  // -------------------------------------------------------------
  // Generate Drake Statement Lines
  // -------------------------------------------------------------
  const lines = generateReturnLines({
    descStyle,
    isPost2017,
    normalizedType,
    rows,
    outstanding,
    formulaExplanation,
    totalInterest,
    fedLimit,
    isFedLimited,
    federalRatio,
    federalPercent,
    federal,
    federalDisallowed,
    stateCap,
    stateRatio,
    statePercent,
    stateTotal,
    stateAdditional,
    stateDisallowed,
    decimals,
  });

  return {
    rows,
    outstanding,
    netMortgage: outstanding,
    interest: totalInterest,
    totalInterest,
    fedLimit,
    federalLimit: fedLimit,
    federalPercent,
    fedPercentValue: federalPercent,
    federalRatio,
    fedRatio: federalRatio,
    federal,
    fedDeductibleInterest: federal,
    federalDisallowed,
    fedDisallowedInterest: federalDisallowed,
    isFedLimited,
    stateCap,
    stateLimit: stateCap,
    statePercent,
    statePercentValue: statePercent,
    stateRatio,
    stateTotal,
    stateTotalInterest: stateTotal,
    stateAdditional,
    stateAdditionalInterest: stateAdditional,
    stateDisallowed,
    stateDisallowedInterest: stateDisallowed,
    formulaExplanation,
    decimals,
    lines,
    descriptionLines: lines,
  };
}

/**
 * Generates line-by-line statement descriptions for Drake Tax Form 1098.
 */
function generateReturnLines(params) {
  const {
    descStyle,
    isPost2017,
    normalizedType,
    rows,
    outstanding,
    formulaExplanation,
    totalInterest,
    fedLimit,
    isFedLimited,
    federalRatio = 1.0,
    federalPercent,
    federal,
    stateCap,
    stateRatio = 1.0,
    statePercent,
    stateTotal,
    stateAdditional,
    decimals,
  } = params;

  if (descStyle === 'simple') {
    const loanLines = rows.flatMap((item) => {
      let avgText = '';
      if (item.balanceType === 'both_avg') {
        avgText = `${item.name} Avg Balance: (${formatCurrency(item.startAmount)} + ${formatCurrency(item.endAmount)}) ÷ 2 = ${formatCurrency(item.avg)}`;
      } else if (item.balanceType === 'start_only') {
        avgText = `${item.name} Avg Balance: ${formatCurrency(item.avg)} (Start Balance)`;
      } else if (item.balanceType === 'end_only') {
        avgText = `${item.name} Avg Balance: ${formatCurrency(item.avg)} (End Balance)`;
      } else {
        avgText = `${item.name} Avg Balance: $0.00`;
      }
      return [avgText, `${item.name} Form 1098 Interest: ${formatCurrency(item.interest)}`];
    });

    const summaryLines = [];
    if (normalizedType === 'refinance') {
      summaryLines.push(
        `Net Mortgage Outstanding: ${formulaExplanation} = ${formatCurrency(outstanding)}`,
        rows.length > 1
          ? `Total Form 1098 Interest: ${rows.map((r) => formatCurrency(r.interest)).join(' + ')} = ${formatCurrency(totalInterest)}`
          : `Total Form 1098 Interest: ${formatCurrency(totalInterest)}`
      );
    } else if (normalizedType === 'first-second') {
      summaryLines.push(
        `Net Mortgage Outstanding: ${formulaExplanation} = ${formatCurrency(outstanding)}`,
        rows.length > 1
          ? `Total Form 1098 Interest: ${rows.map((r) => formatCurrency(r.interest)).join(' + ')} = ${formatCurrency(totalInterest)}`
          : `Total Form 1098 Interest: ${formatCurrency(totalInterest)}`
      );
    } else if (rows.length > 1) {
      summaryLines.push(
        `Total Avg Balance: ${formatCurrency(outstanding)}`,
        `Total Form 1098 Interest: ${formatCurrency(totalInterest)}`
      );
    }

    let fedLines = [];
    if (!isPost2017) {
      // Pre-2017 Regime
      if (isFedLimited) {
        fedLines = [
          `Pre-2017 Limit ($1,000,000): ${formatCurrency(1000000)} ÷ ${formatCurrency(outstanding)} = ${federalRatio.toFixed(decimals)} (${federalPercent}%)`,
          `Eligible Interest (Fed & State): ${formatCurrency(totalInterest)} × ${federalRatio.toFixed(decimals)} (${federalPercent}%) = ${formatCurrency(federal)}`,
        ];
      } else {
        fedLines = [
          `Pre-2017 Limit ($1,000,000): Within limit (100% eligible)`,
          `Eligible Interest (Fed & State): ${formatCurrency(federal)}`,
        ];
      }
      return [...loanLines, ...summaryLines, ...fedLines];
    }

    // Post-2017 Regime
    if (isFedLimited) {
      fedLines = [
        `Federal Limit ($750,000): ${formatCurrency(fedLimit)} ÷ ${formatCurrency(outstanding)} = ${federalRatio.toFixed(decimals)} (${federalPercent}%)`,
        `Federal Deductible: ${formatCurrency(totalInterest)} × ${federalRatio.toFixed(decimals)} (${federalPercent}%) = ${formatCurrency(federal)}`,
      ];
    } else {
      fedLines = [
        `Federal Limit ($750,000): Within limit (100% eligible)`,
        `Federal Deductible: ${formatCurrency(federal)}`,
      ];
    }

    const stateLines = [];
    if (stateAdditional > 0) {
      if (outstanding > stateCap) {
        stateLines.push(
          `State Limit ($1,000,000): ${formatCurrency(stateCap)} ÷ ${formatCurrency(outstanding)} = ${stateRatio.toFixed(decimals)} (${statePercent}%)`,
          `State Deductible: ${formatCurrency(totalInterest)} × ${stateRatio.toFixed(decimals)} (${statePercent}%) = ${formatCurrency(stateTotal)}`
        );
      } else {
        stateLines.push(`State Limit ($1,000,000): Within limit (100% eligible)`);
      }
      stateLines.push(
        `Additional State Deductible: ${formatCurrency(stateTotal)} − ${formatCurrency(federal)} = ${formatCurrency(stateAdditional)}`
      );
    } else {
      stateLines.push(`Additional State Deductible: $0.00`);
    }

    return [...loanLines, ...summaryLines, ...fedLines, ...stateLines];
  }

  // Detailed style
  const loanLines = rows.flatMap((item) => {
    let balanceDesc = '';
    if (item.balanceType === 'both_avg') {
      balanceDesc = `(${formatCurrency(item.startAmount)} beginning balance + ${formatCurrency(item.endAmount)} ending balance) ÷ 2 = ${formatCurrency(item.avg)} average outstanding balance.`;
    } else if (item.balanceType === 'start_only') {
      balanceDesc = `ending balance was not provided; using the beginning balance of ${formatCurrency(item.startAmount)} as the effective balance.`;
    } else if (item.balanceType === 'end_only') {
      balanceDesc = `beginning balance was not provided; using the ending balance of ${formatCurrency(item.endAmount)} as the effective balance.`;
    } else {
      balanceDesc = `no principal balance provided; balance is $0.00.`;
    }
    return [
      `${item.name}: ${balanceDesc}`,
      `${item.name} mortgage interest reported on Form 1098: ${formatCurrency(item.interest)}.`,
    ];
  });

  const typeLabel =
    normalizedType === 'direct'
      ? 'Direct loan'
      : normalizedType === 'refinance'
      ? 'Refinance loans'
      : 'First and second loans';

  const netLine =
    normalizedType === 'refinance'
      ? `${typeLabel} net mortgage outstanding amount = (${rows.map((r) => formatCurrency(r.avg)).join(' + ')}) ÷ 2 = ${formatCurrency(outstanding)}.`
      : normalizedType === 'first-second'
      ? `${typeLabel} net mortgage outstanding amount = ${rows.map((r) => formatCurrency(r.avg)).join(' + ')} = ${formatCurrency(outstanding)}.`
      : `${typeLabel} net mortgage outstanding amount = ${formatCurrency(outstanding)}.`;

  const totalLine =
    rows.length > 1
      ? `Total mortgage interest = ${rows.map((r) => formatCurrency(r.interest)).join(' + ')} = ${formatCurrency(totalInterest)}.`
      : `Total mortgage interest = ${formatCurrency(totalInterest)}.`;

  if (!isPost2017) {
    return [
      ...loanLines,
      netLine,
      totalLine,
      isFedLimited
        ? `Federal/state loan limit: ${formatCurrency(1000000)} ÷ ${formatCurrency(outstanding)} = ${federalRatio.toFixed(decimals)} (${federalPercent}%).`
        : `Net mortgage is within the ${formatCurrency(1000000)} pre-2017 loan limit; 100% of interest is eligible.`,
      `Mortgage interest eligible for federal and state deduction = ${formatCurrency(totalInterest)} × ${federalRatio.toFixed(decimals)} (${federalPercent}%) = ${formatCurrency(federal)}.`,
    ];
  }

  const federalExplanation = isFedLimited
    ? `Federal loan limit: ${formatCurrency(fedLimit)} ÷ ${formatCurrency(outstanding)} = ${federalRatio.toFixed(decimals)} (${federalPercent}%).`
    : `Net mortgage is within the ${formatCurrency(fedLimit)} federal loan limit; 100% of interest is eligible for federal.`;

  const stateExplanation =
    outstanding > stateCap
      ? `State limit calculation: ${formatCurrency(stateCap)} ÷ ${formatCurrency(outstanding)} = ${stateRatio.toFixed(decimals)} (${statePercent}%); ${formatCurrency(totalInterest)} × ${stateRatio.toFixed(decimals)} (${statePercent}%) = ${formatCurrency(stateTotal)} total state-eligible interest.`
      : `Net mortgage is within the ${formatCurrency(stateCap)} state limit; state-eligible interest is ${formatCurrency(totalInterest)}.`;

  return [
    ...loanLines,
    netLine,
    totalLine,
    federalExplanation,
    `Federal mortgage interest eligible for deduction = ${formatCurrency(totalInterest)} × ${federalRatio.toFixed(decimals)} (${federalPercent}%) = ${formatCurrency(federal)}.`,
    stateExplanation,
    `Additional state mortgage interest eligible = ${formatCurrency(stateTotal)} − ${formatCurrency(federal)} = ${formatCurrency(stateAdditional)}.`,
  ];
}

/**
 * Loan Limit Days Calculation Engine
 *
 * Implements the day-based mortgage interest deduction limit:
 * Formula:
 *   Federal Amount = (Federal Limit × Interest Rate × Number of Days) / (100 × Days in Year)
 *   State Amount   = (State Limit × Interest Rate × Number of Days) / (100 × Days in Year)
 *   Additional State = State Amount − Federal Amount
 *
 * Where:
 *   Federal Limit = $750,000 (Post-2017) or $1,000,000 (Pre-2017)
 *   State Limit   = $1,000,000
 *   Days in Year  = 366 (Leap year) or 365 (Regular year)
 */
export function calculateLoanLimitDays({
  rule = 'post', // 'post' | 'pre' | 'post-2017' | 'pre-2017'
  isLeapYear = false,
  periods = [], // [{ id, name, rate, days }]
  decimals = 3,
  descStyle = 'simple', // 'simple' | 'detailed'
}) {
  const isPost2017 = rule === 'post' || rule === 'post-2017';
  const fedLimit = isPost2017 ? 750000 : 1000000;
  const stateCap = 1000000;
  const yearDays = isLeapYear ? 366 : 365;

  const validPeriods = periods.length > 0 ? periods : [{ name: 'Loan 1', rate: '', days: '' }];

  const rows = validPeriods.map((period, idx) => {
    const rawRate = period.rate !== undefined ? period.rate : period.interestRate;
    const rawDays = period.days !== undefined ? period.days : period.noOfDays;

    const rateNum = parseNumber(rawRate);
    const daysNum = Math.min(yearDays, parseNumber(rawDays));
    const name = period.name || `Loan ${idx + 1}`;

    // Formula: (limit * intrate * no of days) / (100 * yearDays)
    const fedAmount = Math.round(((fedLimit * rateNum * daysNum) / (100 * yearDays)) * 100) / 100;
    const stateTotal = Math.round(((stateCap * rateNum * daysNum) / (100 * yearDays)) * 100) / 100;
    const stateAdditional = isPost2017 ? Math.max(0, Math.round((stateTotal - fedAmount) * 100) / 100) : 0;

    const dailyFed = rateNum > 0 ? (fedLimit * (rateNum / 100)) / yearDays : 0;
    const dailyState = rateNum > 0 ? (stateCap * (rateNum / 100)) / yearDays : 0;
    const yearFraction = daysNum > 0 ? (daysNum / yearDays) * 100 : 0;

    return {
      id: period.id || `period-${idx + 1}`,
      name,
      rate: rawRate ?? '',
      rateNum,
      days: rawDays ?? '',
      daysNum,
      fedAmount,
      stateTotal,
      stateAdditional,
      dailyFed,
      dailyState,
      yearFraction,
    };
  });

  const totalFed = Math.round(rows.reduce((sum, r) => sum + r.fedAmount, 0) * 100) / 100;
  const totalState = Math.round(rows.reduce((sum, r) => sum + r.stateTotal, 0) * 100) / 100;
  const totalAdditional = Math.round(rows.reduce((sum, r) => sum + r.stateAdditional, 0) * 100) / 100;
  const totalDays = rows.reduce((sum, r) => sum + r.daysNum, 0);

  const lines = generateDaysReturnLines({
    descStyle,
    isPost2017,
    rows,
    fedLimit,
    stateCap,
    yearDays,
    isLeapYear,
    totalFed,
    totalState,
    totalAdditional,
    totalDays,
    decimals,
  });

  return {
    rows,
    totalFed,
    federal: totalFed,
    totalState,
    stateTotal: totalState,
    totalAdditional,
    stateAdditional: totalAdditional,
    totalDays,
    fedLimit,
    federalLimit: fedLimit,
    stateCap,
    stateLimit: stateCap,
    yearDays,
    isLeapYear,
    isPost2017,
    decimals,
    lines,
    descriptionLines: lines,
  };
}

/**
 * Generates Drake Tax statement lines for the day-based mortgage interest calculation.
 */
function generateDaysReturnLines({
  descStyle,
  isPost2017,
  rows,
  fedLimit,
  stateCap,
  yearDays,
  isLeapYear,
  totalFed,
  totalState,
  totalAdditional,
  totalDays,
}) {
  const yearText = isLeapYear ? '366 days (Leap Year)' : '365 days';

  if (descStyle === 'simple') {
    const loanLines = rows.flatMap((r) => {
      const items = [
        `${r.name}: ${r.rateNum.toFixed(2)}% interest rate · ${r.daysNum} / ${yearDays} days`,
      ];
      if (isPost2017) {
        items.push(
          `${r.name} Federal Limit (${formatCurrency(fedLimit)}): (${formatCurrency(fedLimit)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ ${yearDays} = ${formatCurrency(r.fedAmount)}`,
          `${r.name} State Limit (${formatCurrency(stateCap)}): (${formatCurrency(stateCap)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ ${yearDays} = ${formatCurrency(r.stateTotal)}`,
          `${r.name} Additional State Deductible: ${formatCurrency(r.stateTotal)} − ${formatCurrency(r.fedAmount)} = ${formatCurrency(r.stateAdditional)}`
        );
      } else {
        items.push(
          `${r.name} Limit (${formatCurrency(fedLimit)}): (${formatCurrency(fedLimit)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ ${yearDays} = ${formatCurrency(r.fedAmount)}`,
          `${r.name} Eligible Interest (Fed & State): ${formatCurrency(r.fedAmount)}`,
          `${r.name} Additional State Deductible: $0.00`
        );
      }
      return items;
    });

    const summaryLines = [];
    if (rows.length > 1) {
      summaryLines.push(
        `Total Days Active: ${totalDays} / ${yearDays} days`,
        `Total Federal Deductible: ${rows.map((r) => formatCurrency(r.fedAmount)).join(' + ')} = ${formatCurrency(totalFed)}`
      );
      if (isPost2017) {
        summaryLines.push(
          `Total State Deductible: ${rows.map((r) => formatCurrency(r.stateTotal)).join(' + ')} = ${formatCurrency(totalState)}`,
          `Total Additional State Deductible: ${rows.map((r) => formatCurrency(r.stateAdditional)).join(' + ')} = ${formatCurrency(totalAdditional)}`
        );
      }
    }

    return [...loanLines, ...summaryLines];
  }

  // Detailed style
  const loanLines = rows.flatMap((r) => {
    const items = [
      `${r.name}: Annual interest rate of ${r.rateNum.toFixed(2)}% in effect for ${r.daysNum} days during the ${yearText} tax year.`,
    ];
    if (isPost2017) {
      items.push(
        `Federal allowable interest under post-2017 limit (${formatCurrency(fedLimit)}) = (${formatCurrency(fedLimit)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ (100 × ${yearDays}) = ${formatCurrency(r.fedAmount)}.`,
        `State allowable interest under statutory limit (${formatCurrency(stateCap)}) = (${formatCurrency(stateCap)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ (100 × ${yearDays}) = ${formatCurrency(r.stateTotal)}.`,
        `Additional state allowable mortgage interest = ${formatCurrency(r.stateTotal)} − ${formatCurrency(r.fedAmount)} = ${formatCurrency(r.stateAdditional)}.`
      );
    } else {
      items.push(
        `Allowable interest under pre-2017 limit (${formatCurrency(fedLimit)}) = (${formatCurrency(fedLimit)} × ${r.rateNum.toFixed(2)}% × ${r.daysNum}) ÷ (100 × ${yearDays}) = ${formatCurrency(r.fedAmount)}.`,
        `Pre-2017 state conformity matches federal limit; additional state adjustment is $0.00.`
      );
    }
    return items;
  });

  const summaryLines = [];
  if (rows.length > 1) {
    summaryLines.push(
      `Total federal deductible mortgage interest across all loan periods = ${formatCurrency(totalFed)}.`,
      isPost2017
        ? `Total additional state mortgage interest deductible across all loan periods = ${formatCurrency(totalAdditional)}.`
        : `Total eligible mortgage interest across all loan periods = ${formatCurrency(totalFed)}.`
    );
  }

  return [...loanLines, ...summaryLines];
}
